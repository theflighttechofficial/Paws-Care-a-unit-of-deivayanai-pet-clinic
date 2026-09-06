import { pool } from "../config/db.js"

const DEFAULT_CONSULTATION_FEE_PAISE = 20000 // ₹200

// Matches the booking page's previous hardcoded hours exactly (Mon–Sat
// 9am–1pm + 4pm–10pm, Sun 9am–1pm, 30-minute slots) so adding admin control
// doesn't change anything until an admin actually edits it.
const DEFAULT_BOOKING_SCHEDULE = {
  slotIntervalMinutes: 30,
  weekdaySessions: [
    { startHour: 9, endHour: 13 },
    { startHour: 16, endHour: 22 },
  ],
  sundaySessions: [{ startHour: 9, endHour: 13 }],
}

// Singleton settings row, same pattern as google_calendar_connection.
export const ensureAppSettingsTable = async () => {
  await pool.query(`
    create table if not exists public.app_settings (
      id boolean primary key default true,
      consultation_fee_paise integer not null default ${DEFAULT_CONSULTATION_FEE_PAISE},
      updated_at timestamptz not null default now(),
      constraint app_settings_singleton check (id)
    )
  `)
  await pool.query("insert into public.app_settings (id) values (true) on conflict (id) do nothing")
  await pool.query("alter table public.app_settings add column if not exists booking_schedule jsonb")
  await pool.query(
    `update public.app_settings set booking_schedule = $1 where id = true and booking_schedule is null`,
    [JSON.stringify(DEFAULT_BOOKING_SCHEDULE)]
  )
}

export const getConsultationFeePaise = async () => {
  const { rows } = await pool.query("select consultation_fee_paise from public.app_settings where id = true")
  return rows[0]?.consultation_fee_paise ?? DEFAULT_CONSULTATION_FEE_PAISE
}

export const setConsultationFeePaise = async (amountPaise) => {
  const { rows } = await pool.query(
    `update public.app_settings set consultation_fee_paise = $1, updated_at = now() where id = true returning *`,
    [amountPaise]
  )
  return rows[0]
}

export const getBookingSchedule = async () => {
  const { rows } = await pool.query("select booking_schedule from public.app_settings where id = true")
  return rows[0]?.booking_schedule ?? DEFAULT_BOOKING_SCHEDULE
}

export const setBookingSchedule = async (schedule) => {
  const { rows } = await pool.query(
    `update public.app_settings set booking_schedule = $1, updated_at = now() where id = true returning *`,
    [JSON.stringify(schedule)]
  )
  return rows[0]
}
