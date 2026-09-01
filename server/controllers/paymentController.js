import crypto from "crypto"
import Razorpay from "razorpay"
import { createManualPayment, createPaymentRecord, findPaymentById, listAllPayments, listPaymentsByOwner, markPaymentPaid } from "../db/payments.js"
import { findAppointmentById } from "../db/appointments.js"

const CONSULTATION_FEE_PAISE = 20000 // ₹200, flat fee for online/phone consultations
const VALID_PURPOSES = ["online_consultation", "phone_consultation"]
const VALID_METHODS = ["cash", "card", "upi", "other"]

const purposeForConsultationType = (type) => {
  if (type === "online") return "online_consultation"
  if (type === "phone") return "phone_consultation"
  return "clinic_visit"
}

const getClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export const createOrder = async (req, res) => {
  try {
    const { purpose, appointmentId } = req.body

    if (!VALID_PURPOSES.includes(purpose)) {
      return res.status(400).json({ message: "A valid payment purpose is required." })
    }

    const razorpay = getClient()
    if (!razorpay) {
      return res.status(503).json({
        message: "Payments aren't configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to continue.",
      })
    }

    // Online consultations already have a real appointment by this point —
    // confirm it belongs to the requester. Phone consultations are paid for
    // before any appointment/slot exists, so appointmentId is optional there.
    if (appointmentId) {
      const appointment = await findAppointmentById(appointmentId)
      if (!appointment || appointment.owner_id !== req.user.id) {
        return res.status(404).json({ message: "Appointment not found." })
      }
    }

    const order = await razorpay.orders.create({
      amount: CONSULTATION_FEE_PAISE,
      currency: "INR",
      receipt: `consult_${Date.now()}`,
      notes: { purpose, ownerId: req.user.id },
    })

    const payment = await createPaymentRecord({
      ownerId: req.user.id,
      appointmentId: appointmentId || null,
      purpose,
      amountPaise: CONSULTATION_FEE_PAISE,
      razorpayOrderId: order.id,
    })

    return res.status(201).json({
      paymentId: payment.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("Create payment order error:", error)
    return res.status(500).json({ message: "Unable to start payment. Please try again." })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpay_order_id: orderId, razorpay_payment_id: paymentIdFromGateway, razorpay_signature: signature } = req.body

    if (!paymentId || !orderId || !paymentIdFromGateway || !signature) {
      return res.status(400).json({ message: "Missing payment verification details." })
    }

    const payment = await findPaymentById(paymentId)
    if (!payment || payment.owner_id !== req.user.id || payment.razorpay_order_id !== orderId) {
      return res.status(404).json({ message: "Payment record not found." })
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentIdFromGateway}`)
      .digest("hex")

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: "Payment verification failed." })
    }

    const updated = await markPaymentPaid(paymentId, paymentIdFromGateway)
    return res.json({ message: "Payment verified.", payment: updated })
  } catch (error) {
    console.error("Verify payment error:", error)
    return res.status(500).json({ message: "Unable to verify payment. Please try again." })
  }
}

export const getMyPayments = async (req, res) => {
  try {
    const payments = await listPaymentsByOwner(req.user.id)
    return res.json({ success: true, payments })
  } catch (error) {
    console.error("List owner payments error:", error)
    return res.status(500).json({ message: "Unable to load your payment history." })
  }
}

export const getAllPayments = async (req, res) => {
  try {
    const payments = await listAllPayments()
    return res.json({ success: true, payments })
  } catch (error) {
    console.error("List admin payments error:", error)
    return res.status(500).json({ message: "Unable to load payments." })
  }
}

export const recordManualPayment = async (req, res) => {
  const { appointmentId, amount, method, notes } = req.body

  if (!appointmentId) {
    return res.status(400).json({ message: "An appointment is required." })
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number." })
  }

  if (!VALID_METHODS.includes(method)) {
    return res.status(400).json({ message: "A valid payment method is required." })
  }

  const appointment = await findAppointmentById(appointmentId)
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." })
  }

  const payment = await createManualPayment({
    ownerId: appointment.owner_id,
    appointmentId,
    amountPaise: Math.round(Number(amount) * 100),
    method,
    notes,
    recordedBy: req.user.id,
    purpose: purposeForConsultationType(appointment.consultation_type),
  })

  return res.status(201).json({ message: "Payment recorded.", payment })
}
