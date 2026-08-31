import crypto from "crypto"
import Razorpay from "razorpay"
import { createPaymentRecord, findPaymentById, markPaymentPaid } from "../db/payments.js"
import { findAppointmentById } from "../db/appointments.js"

const CONSULTATION_FEE_PAISE = 20000 // ₹200, flat fee for online/phone consultations
const VALID_PURPOSES = ["online_consultation", "phone_consultation"]

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
