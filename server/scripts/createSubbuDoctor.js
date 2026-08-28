// One-off: create the doctor profile + doctors row for M. Subramanian.
import bcrypt from "bcryptjs"
import crypto from "crypto"
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

const DOCTOR = {
  email: "subbu76_vet@yahoo.com",
  name: "M. Subramanian",
  specialization: "Veterinarian",
  experience: 20,
  bio: "Veterinarian with over 20 years of experience in companion animal care.",
  phone: "9841050748",
}

const generatePassword = () => crypto.randomBytes(9).toString("base64url")

async function main() {
  const { rows: existing } = await pool.query("select * from public.profiles where email = $1", [DOCTOR.email.toLowerCase()])
  let profile = existing[0]

  if (!profile) {
    const password = generatePassword()
    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      `insert into public.profiles (email, password_hash, full_name, phone, role)
       values ($1, $2, $3, $4, 'doctor') returning *`,
      [DOCTOR.email.toLowerCase(), passwordHash, DOCTOR.name, DOCTOR.phone]
    )
    profile = rows[0]
    console.log(`Created profile for ${DOCTOR.email}`)
    console.log(`Temporary password (shown once): ${password}`)
  } else {
    console.log(`Profile already exists for ${DOCTOR.email} (id: ${profile.id})`)
  }

  const { rows: existingDoctor } = await pool.query("select * from public.doctors where profile_id = $1", [profile.id])
  if (!existingDoctor[0]) {
    await pool.query(
      `insert into public.doctors (profile_id, specialization, experience, bio, availability)
       values ($1, $2, $3, $4, '[]'::jsonb)`,
      [profile.id, DOCTOR.specialization, DOCTOR.experience, DOCTOR.bio]
    )
    console.log("Created doctors row.")
  } else {
    console.log("Doctors row already exists.")
  }

  await pool.end()
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
