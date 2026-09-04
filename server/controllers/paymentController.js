import crypto from "crypto"
import Razorpay from "razorpay"
import { createManualPayment, createPaymentRecord, findPaymentById, listAllPayments, listPaymentsByOwner, markPaymentPaid } from "../db/payments.js"
import { findAppointmentById } from "../db/appointments.js"
import { getConsultationFeePaise } from "../db/settings.js"
import { BookingError, bookAppointmentForOwner, validateBookingDetails } from "../services/bookingService.js"

const VALID_PURPOSES = ["online_consultation", "phone_consultation", "clinic_visit"]
// Purposes that reserve a calendar slot — a payment for these must carry
// bookingDetails, and the slot is only actually created once paid.
const SLOT_PURPOSES = ["online_consultation", "clinic_visit"]
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
    const { purpose, bookingDetails, appointmentId } = req.body

    if (!VALID_PURPOSES.includes(purpose)) {
      return res.status(400).json({ message: "A valid payment purpose is required." })
    }

    const razorpay = getClient()
    if (!razorpay) {
      return res.status(503).json({
        message: "Payments aren't configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to continue.",
      })
    }

    // Two ways a slot-purpose payment can arrive:
    //  - bookingDetails: a brand-new booking — the appointment is only
    //    created after payment succeeds (see verifyPayment).
    //  - appointmentId: paying for a slot that was already reserved
    //    earlier (e.g. from the appointments list) — just confirm it's
    //    the requester's own appointment.
    // Either way this is a fast pre-check; the authoritative check runs
    // again post-payment since the slot can still be taken/changed meanwhile.
    let validatedAppointmentId = null
    if (SLOT_PURPOSES.includes(purpose)) {
      if (bookingDetails) {
        try {
          await validateBookingDetails(req.user.id, bookingDetails)
        } catch (error) {
          if (error instanceof BookingError) {
            return res.status(error.status).json({ message: error.message })
          }
          throw error
        }
      } else if (appointmentId) {
        const appointment = await findAppointmentById(appointmentId)
        if (!appointment || appointment.owner_id !== req.user.id) {
          return res.status(404).json({ message: "Appointment not found." })
        }
        validatedAppointmentId = appointmentId
      } else {
        return res.status(400).json({ message: "Booking details are required to reserve a slot." })
      }
    }

    const amountPaise = await getConsultationFeePaise()
    if (!Number.isInteger(amountPaise) || amountPaise < 100) {
      return res.status(500).json({ message: "Consultation fee is misconfigured." })
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `consult_${Date.now()}`,
      notes: { purpose, ownerId: req.user.id },
    })

    const payment = await createPaymentRecord({
      ownerId: req.user.id,
      purpose,
      amountPaise,
      razorpayOrderId: order.id,
      bookingDetails: bookingDetails && !validatedAppointmentId ? bookingDetails : null,
      appointmentId: validatedAppointmentId,
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

    if (payment.status === "paid") {
      // Idempotent retry (e.g. the success handler firing twice) — never
      // book a second appointment for the same payment.
      const appointment = payment.appointment_id ? await findAppointmentById(payment.appointment_id) : null
      return res.json({ message: "Payment already verified.", payment, appointment })
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentIdFromGateway}`)
      .digest("hex")

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: "Payment verification failed." })
    }

    let appointment = null
    let googleCalendarStatus = null

    if (payment.booking_details) {
      try {
        const result = await bookAppointmentForOwner(req.user.id, payment.booking_details)
        appointment = result.appointment
        googleCalendarStatus = result.googleCalendarStatus?.message || null
      } catch (error) {
        // The charge succeeded on Razorpay's side but the slot is gone —
        // most likely someone else booked it in the time the payer spent
        // in the checkout modal. Keep the payment recorded as paid (the
        // clinic needs to see and refund it) but don't fabricate a booking.
        console.error("Post-payment booking failed:", error)
        const updated = await markPaymentPaid(paymentId, paymentIdFromGateway)
        const reason = error instanceof BookingError ? error.message : "we couldn't reserve the slot"
        return res.status(409).json({
          message: `Payment received, but ${reason.charAt(0).toLowerCase()}${reason.slice(1)} Please contact the clinic for a refund.`,
          payment: updated,
        })
      }
    } else if (payment.appointment_id) {
      // Paying for a slot that was already reserved earlier.
      appointment = await findAppointmentById(payment.appointment_id)
    }

    const updated = await markPaymentPaid(paymentId, paymentIdFromGateway, appointment?.id)
    return res.json({ message: "Payment verified.", payment: updated, appointment, googleCalendarStatus })
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
