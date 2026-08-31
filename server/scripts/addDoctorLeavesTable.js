// One-off: create public.doctor_leaves on an already-provisioned DB.
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

async function main() {
  await pool.query(`
    create table if not exists public.doctor_leaves (
      id uuid primary key default gen_random_uuid(),
      doctor_id uuid not null references public.doctors(id) on delete cascade,
      leave_date date not null,
      reason text,
      created_at timestamptz not null default now(),
      unique (doctor_id, leave_date)
    )
  `)
  console.log("public.doctor_leaves is in place.")
  await pool.end()
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
