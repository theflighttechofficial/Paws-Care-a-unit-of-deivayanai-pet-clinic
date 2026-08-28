// One-off: add password-reset columns to profiles on an already-provisioned DB.
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

async function main() {
  await pool.query(`
    alter table public.profiles
      add column if not exists reset_token_hash text,
      add column if not exists reset_token_expires timestamptz
  `)
  console.log("profiles.reset_token_hash / reset_token_expires are in place.")
  await pool.end()
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
