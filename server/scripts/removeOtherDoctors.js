// One-off: remove every doctor account except M. Subramanian.
// Any appointments/medical records tied to the removed doctors are
// reassigned to M. Subramanian rather than deleted (preserves history).
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

const KEEP_EMAIL = "subbu76_vet@yahoo.com"

async function main() {
  const { rows: keepProfile } = await pool.query(
    "select p.id as profile_id, d.id as doctor_id from public.profiles p join public.doctors d on d.profile_id = p.id where p.email = $1",
    [KEEP_EMAIL]
  )
  if (!keepProfile[0]) {
    console.error(`No doctor found with email ${KEEP_EMAIL}. Aborting.`)
    process.exit(1)
  }
  const keepDoctorId = keepProfile[0].doctor_id

  const { rows: others } = await pool.query(
    `select d.id as doctor_id, d.profile_id, p.email, p.full_name
     from public.doctors d join public.profiles p on p.id = d.profile_id
     where d.id <> $1`,
    [keepDoctorId]
  )

  if (!others.length) {
    console.log("No other doctors to remove.")
    await pool.end()
    return
  }

  for (const doc of others) {
    const { rowCount: apptCount } = await pool.query(
      "update public.appointments set doctor_id = $1 where doctor_id = $2",
      [keepDoctorId, doc.doctor_id]
    )
    const { rowCount: recordCount } = await pool.query(
      "update public.medical_records set doctor_id = $1 where doctor_id = $2",
      [keepDoctorId, doc.doctor_id]
    )
    await pool.query("delete from public.doctors where id = $1", [doc.doctor_id])
    await pool.query("delete from public.profiles where id = $1", [doc.profile_id])
    console.log(
      `Removed ${doc.full_name} (${doc.email}) — reassigned ${apptCount} appointment(s) and ${recordCount} medical record(s) to M. Subramanian.`
    )
  }

  console.log("\nDone.")
  await pool.end()
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
