// One-off: create public.payments on an already-provisioned DB.
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

async function main() {
  await pool.query(`
    create table if not exists public.payments (
      id uuid primary key default gen_random_uuid(),
      owner_id uuid not null references public.profiles(id) on delete cascade,
      appointment_id uuid references public.appointments(id) on delete set null,
      purpose text not null check (purpose in ('online_consultation', 'phone_consultation')),
      amount_paise integer not null,
      razorpay_order_id text not null,
      razorpay_payment_id text,
      status text not null default 'created' check (status in ('created', 'paid', 'failed')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  console.log("public.payments is in place.")
  await pool.end()
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
