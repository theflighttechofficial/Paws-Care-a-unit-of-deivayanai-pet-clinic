import { pool } from "../config/db.js"

// Idempotent bootstrap so an existing database picks up manual/clinic
// payment support without a hand-run migration. Widens the original
// Razorpay-only schema: order id becomes optional, purpose gains a
// 'clinic_visit' option, and method/recorded_by/notes track who logged a
// manually-collected (cash/card/UPI) payment and why.
export const ensurePaymentsExtensions = async () => {
  await pool.query("alter table public.payments alter column razorpay_order_id drop not null")
  await pool.query("alter table public.payments add column if not exists method text not null default 'razorpay'")
  await pool.query("alter table public.payments add column if not exists recorded_by uuid references public.profiles(id)")
  await pool.query("alter table public.payments add column if not exists notes text")
  await pool.query("alter table public.payments drop constraint if exists payments_purpose_check")
  await pool.query(`
    alter table public.payments add constraint payments_purpose_check
      check (purpose in ('online_consultation', 'phone_consultation', 'clinic_visit'))
  `)
  await pool.query("alter table public.payments drop constraint if exists payments_method_check")
  await pool.query(`
    alter table public.payments add constraint payments_method_check
      check (method in ('razorpay', 'cash', 'card', 'upi', 'other'))
  `)
}

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

const PAYMENT_SELECT = `
  select
    p.*,
    a.service,
    a.appointment_date,
    a.appointment_time,
    a.consultation_type,
    row_to_json(pt.*) as pet
  from public.payments p
  left join public.appointments a on a.id = p.appointment_id
  left join public.pets pt on pt.id = a.pet_id
`

export const listPaymentsByOwner = async (ownerId) => {
  const { rows } = await pool.query(`${PAYMENT_SELECT} where p.owner_id = $1 order by p.created_at desc`, [ownerId])
  return rows
}

export const listAllPayments = async () => {
  const { rows } = await pool.query(`
    select
      p.*,
      a.service,
      a.appointment_date,
      a.appointment_time,
      a.consultation_type,
      row_to_json(pt.*) as pet,
      json_build_object('id', op.id, 'full_name', op.full_name, 'email', op.email) as owner
    from public.payments p
    left join public.appointments a on a.id = p.appointment_id
    left join public.pets pt on pt.id = a.pet_id
    join public.profiles op on op.id = p.owner_id
    order by p.created_at desc
  `)
  return rows
}

export const createManualPayment = async ({ ownerId, appointmentId, amountPaise, method, notes, recordedBy, purpose }) => {
  const { rows } = await pool.query(
    `insert into public.payments (owner_id, appointment_id, purpose, amount_paise, status, method, notes, recorded_by)
     values ($1, $2, $3, $4, 'paid', $5, $6, $7)
     returning *`,
    [ownerId, appointmentId, purpose, amountPaise, method, notes || null, recordedBy]
  )
  return rows[0]
}
