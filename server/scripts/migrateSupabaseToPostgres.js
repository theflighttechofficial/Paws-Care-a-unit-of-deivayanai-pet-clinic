// One-time data migration: Supabase Postgres -> self-hosted Postgres.
//
// SAFETY: Read-only against the source (Supabase). Only inserts into the
// target — never deletes/truncates/updates existing target rows (skips a
// row if its id already exists there), so it's safe to re-run.
//
// Both databases are plain Postgres, so this is a straight data copy in FK
// order (profiles -> doctors -> pets -> appointments -> medical_records),
// preserving every existing UUID so relationships stay intact untouched.
//
// Supabase Auth's password hashes live in auth.users under GoTrue's own
// scheme and are deliberately NOT copied. Each migrated profile instead
// gets a freshly generated temporary password (bcrypt-hashed before
// storage), printed once to the console so the account holder can log in
// and should change it.
//
// Usage:
//   node server/scripts/migrateSupabaseToPostgres.js
//
// Requires in .env:
//   SUPABASE_SOURCE_DATABASE_URL   the Supabase project's native Postgres
//                                  connection string (Project Settings ->
//                                  Database -> Connection string), NOT the
//                                  anon/service-role REST key.
//   DATABASE_URL                   the new target Postgres.

import bcrypt from "bcryptjs"
import crypto from "crypto"
import dotenv from "dotenv"
import pg from "pg"

dotenv.config()

const { sourceUrl, targetUrl } = {
  sourceUrl: process.env.SUPABASE_SOURCE_DATABASE_URL,
  targetUrl: process.env.DATABASE_URL,
}

if (!sourceUrl || !targetUrl) {
  console.error("Missing SUPABASE_SOURCE_DATABASE_URL / DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

const source = new pg.Pool({ connectionString: sourceUrl })
const target = new pg.Pool({ connectionString: targetUrl })

const generatePassword = () => crypto.randomBytes(9).toString("base64url")

const credentials = []

async function migrateProfiles() {
  const { rows } = await source.query(`
    select p.id, p.full_name, p.phone, p.role, p.avatar_url, p.created_at, p.updated_at, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at asc
  `)

  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    const { rows: existing } = await target.query("select id from public.profiles where id = $1", [row.id])
    if (existing[0]) {
      skipped += 1
      continue
    }

    const password = generatePassword()
    const passwordHash = await bcrypt.hash(password, 12)

    await target.query(
      `insert into public.profiles (id, email, password_hash, full_name, phone, role, avatar_url, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [row.id, row.email.toLowerCase(), passwordHash, row.full_name, row.phone, row.role, row.avatar_url, row.created_at, row.updated_at]
    )

    credentials.push({ email: row.email, role: row.role, password })
    migrated += 1
  }

  return { migrated, skipped, total: rows.length }
}

async function migrateTable(tableName, columns, jsonbColumns = []) {
  const { rows } = await source.query(`select ${columns.join(", ")} from public.${tableName} order by created_at asc`)

  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    const { rows: existing } = await target.query(`select id from public.${tableName} where id = $1`, [row.id])
    if (existing[0]) {
      skipped += 1
      continue
    }

    const values = columns.map((column) =>
      jsonbColumns.includes(column) && row[column] !== null ? JSON.stringify(row[column]) : row[column]
    )
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ")

    await target.query(
      `insert into public.${tableName} (${columns.join(", ")}) values (${placeholders})`,
      values
    )
    migrated += 1
  }

  return { migrated, skipped, total: rows.length }
}

async function main() {
  console.log("Migrating profiles...")
  const profilesResult = await migrateProfiles()

  console.log("Migrating doctors...")
  const doctorsResult = await migrateTable("doctors", [
    "id", "profile_id", "specialization", "experience", "bio", "availability", "created_at", "updated_at",
  ], ["availability"])

  console.log("Migrating pets...")
  const petsResult = await migrateTable("pets", [
    "id", "owner_id", "name", "species", "breed", "gender", "date_of_birth", "weight", "color",
    "microchip_id", "profile_image", "notes", "created_at", "updated_at",
  ])

  console.log("Migrating appointments...")
  const appointmentsResult = await migrateTable("appointments", [
    "id", "owner_id", "pet_id", "doctor_id", "service", "consultation_type", "appointment_date",
    "appointment_time", "duration", "status", "google_calendar_event_id", "google_meet_url",
    "google_sync_status", "notes", "created_at", "updated_at",
  ])

  console.log("Migrating medical records...")
  const recordsResult = await migrateTable("medical_records", [
    "id", "pet_id", "doctor_id", "appointment_id", "symptoms", "clinical_notes", "diagnosis",
    "treatment", "prescription", "vitals", "created_at", "updated_at",
  ], ["prescription", "vitals"])

  console.log("\n=== MIGRATION SUMMARY ===")
  console.log(JSON.stringify({
    profiles: profilesResult,
    doctors: doctorsResult,
    pets: petsResult,
    appointments: appointmentsResult,
    medical_records: recordsResult,
  }, null, 2))

  if (credentials.length) {
    console.log("\n=== TEMPORARY PASSWORDS FOR MIGRATED ACCOUNTS (shown once) ===")
    credentials.forEach(({ email, role, password }) => console.log(`${email} (${role}): ${password}`))
  }

  console.log("\nDone. Source (Supabase) was not modified. No existing target rows were changed.")

  await source.end()
  await target.end()
}

main().catch((err) => {
  console.error("Migration failed:", err.message)
  process.exit(1)
})
