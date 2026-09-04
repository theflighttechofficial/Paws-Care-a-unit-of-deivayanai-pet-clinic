import { pool } from "../config/db.js"

const DEFAULT_CONSULTATION_FEE_PAISE = 20000 // ₹200

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
