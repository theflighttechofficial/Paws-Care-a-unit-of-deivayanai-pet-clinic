import { pool } from "../config/db.js"

export const createPaymentRecord = async ({ ownerId, appointmentId, purpose, amountPaise, razorpayOrderId }) => {
  const { rows } = await pool.query(
    `insert into public.payments (owner_id, appointment_id, purpose, amount_paise, razorpay_order_id, status)
     values ($1, $2, $3, $4, $5, 'created')
     returning *`,
    [ownerId, appointmentId || null, purpose, amountPaise, razorpayOrderId]
  )
  return rows[0]
}

export const findPaymentById = async (id) => {
  const { rows } = await pool.query("select * from public.payments where id = $1", [id])
  return rows[0] || null
}

export const markPaymentPaid = async (id, razorpayPaymentId) => {
  const { rows } = await pool.query(
    `update public.payments
     set status = 'paid', razorpay_payment_id = $2, updated_at = now()
     where id = $1
     returning *`,
    [id, razorpayPaymentId]
  )
  return rows[0]
}

export const markPaymentFailed = async (id) => {
  await pool.query("update public.payments set status = 'failed', updated_at = now() where id = $1", [id])
}
