// Development data seeder for Paws & Care (self-hosted Postgres).
//
// SAFETY: Only inserts. Never deletes, truncates, or overwrites existing
// rows (except a freshly-created account's own role, which the trigger-free
// schema doesn't set for you). Every insert is preceded by a "does this
// already exist?" check, so running this script multiple times is safe and
// will not create duplicate doctors, pets, appointments, or medical records.
//
// Usage:
//   node server/scripts/seedDevelopmentData.js
//
// Requires DATABASE_URL in .env (the target Postgres from server/db/schema.sql).
// Prints each seeded account's temporary password once — nothing is logged
// anywhere else, and passwords are stored only as bcrypt hashes.

import bcrypt from "bcryptjs"
import crypto from "crypto"
import dotenv from "dotenv"
import { pool } from "../config/db.js"

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env. Refusing to continue.")
  process.exit(1)
}

const DOCTORS = [
  {
    email: "dr.ananya.kumar@pawsandcare.dev",
    name: "Dr. Ananya Kumar",
    specialization: "Veterinary General Medicine",
    experience: 8,
    bio: "Experienced veterinarian specializing in preventive care, routine consultations and companion animal health.",
  },
  {
    email: "dr.rahul.menon@pawsandcare.dev",
    name: "Dr. Rahul Menon",
    specialization: "Veterinary Surgery",
    experience: 10,
    bio: "Veterinary surgeon specializing in soft tissue procedures, surgical consultations and post-operative care.",
  },
  {
    email: "dr.meera.iyer@pawsandcare.dev",
    name: "Dr. Meera Iyer",
    specialization: "Veterinary Dermatology",
    experience: 6,
    bio: "Veterinarian focused on dermatological conditions, allergies and skin health in companion animals.",
  },
]

const DEV_OWNER = { email: "dev.owner@pawsandcare.dev", name: "Dev Owner", phone: "9876500000" }
const ADMIN = { email: "admin@pawsandcare.dev", name: "Clinic Admin", phone: "9876511111" }

const credentials = []

const generatePassword = () => crypto.randomBytes(9).toString("base64url")

async function findOrCreateProfile(email, name, phone, role) {
  const { rows: existing } = await pool.query("select * from public.profiles where email = $1", [email.toLowerCase()])
  if (existing[0]) return { profile: existing[0], created: false }

  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)

  const { rows } = await pool.query(
    `insert into public.profiles (email, password_hash, full_name, phone, role)
     values ($1, $2, $3, $4, $5) returning *`,
    [email.toLowerCase(), passwordHash, name, phone || null, role]
  )

  credentials.push({ email, password, role })
  return { profile: rows[0], created: true }
}

async function ensureDoctorRow(profileId, doctorInfo) {
  const { rows: existing } = await pool.query("select * from public.doctors where profile_id = $1", [profileId])
  if (existing[0]) return { row: existing[0], created: false }

  const { rows } = await pool.query(
    `insert into public.doctors (profile_id, specialization, experience, bio, availability)
     values ($1, $2, $3, $4, '[]'::jsonb) returning *`,
    [profileId, doctorInfo.specialization, doctorInfo.experience, doctorInfo.bio]
  )
  return { row: rows[0], created: true }
}

async function ensurePet(ownerId, pet) {
  const { rows: existing } = await pool.query(
    "select * from public.pets where owner_id = $1 and name = $2",
    [ownerId, pet.name]
  )
  if (existing[0]) return { row: existing[0], created: false }

  const { rows } = await pool.query(
    `insert into public.pets (owner_id, name, species, breed, gender, date_of_birth, weight)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [ownerId, pet.name, pet.species, pet.breed, pet.gender, pet.date_of_birth, pet.weight]
  )
  return { row: rows[0], created: true }
}

async function ensureAppointment(appt) {
  const { rows: existing } = await pool.query(
    `select * from public.appointments
     where owner_id = $1 and pet_id = $2 and doctor_id = $3 and appointment_date = $4 and appointment_time = $5`,
    [appt.owner_id, appt.pet_id, appt.doctor_id, appt.appointment_date, appt.appointment_time]
  )
  if (existing[0]) return { row: existing[0], created: false }

  const { rows } = await pool.query(
    `insert into public.appointments
      (owner_id, pet_id, doctor_id, service, consultation_type, appointment_date, appointment_time, duration, status)
     values ($1, $2, $3, $4, $5, $6, $7, 30, $8) returning *`,
    [appt.owner_id, appt.pet_id, appt.doctor_id, appt.service, appt.consultation_type, appt.appointment_date, appt.appointment_time, appt.status]
  )
  return { row: rows[0], created: true }
}

async function ensureMedicalRecord(record) {
  const { rows: existing } = await pool.query(
    "select * from public.medical_records where appointment_id = $1",
    [record.appointment_id]
  )
  if (existing[0]) return { row: existing[0], created: false }

  const { rows } = await pool.query(
    `insert into public.medical_records
      (pet_id, doctor_id, appointment_id, symptoms, clinical_notes, diagnosis, treatment, prescription, vitals)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [record.pet_id, record.doctor_id, record.appointment_id, record.symptoms, record.clinical_notes, record.diagnosis, record.treatment, JSON.stringify(record.prescription), JSON.stringify(record.vitals)]
  )
  return { row: rows[0], created: true }
}

const isoDateOffset = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const summary = { profilesCreated: 0, doctorsCreated: 0, petsCreated: 0, appointmentsCreated: 0, medicalRecordsCreated: 0 }

  const { rows: owners } = await pool.query("select * from public.profiles where role = 'owner' order by created_at asc")
  let ownerProfile = owners[0]

  if (!ownerProfile) {
    const { profile, created } = await findOrCreateProfile(DEV_OWNER.email, DEV_OWNER.name, DEV_OWNER.phone, "owner")
    ownerProfile = profile
    if (created) summary.profilesCreated += 1
    console.log(`No existing owner found — created dev owner ${DEV_OWNER.email}.`)
  } else {
    console.log(`Using existing owner profile: ${ownerProfile.id} (${ownerProfile.email})`)
  }

  const { created: adminCreated } = await findOrCreateProfile(ADMIN.email, ADMIN.name, ADMIN.phone, "admin")
  if (adminCreated) summary.profilesCreated += 1

  const doctorRows = []
  for (const doctorInfo of DOCTORS) {
    const { profile, created } = await findOrCreateProfile(doctorInfo.email, doctorInfo.name, null, "doctor")
    if (created) summary.profilesCreated += 1
    const { row: doctorRow, created: doctorCreated } = await ensureDoctorRow(profile.id, doctorInfo)
    if (doctorCreated) summary.doctorsCreated += 1
    doctorRows.push(doctorRow)
  }
  const [drAnanya, drRahul, drMeera] = doctorRows

  const { row: bruno } = await ensurePet(ownerProfile.id, {
    name: "Bruno", species: "Dog", breed: "Labrador Retriever", gender: "Male", date_of_birth: "2021-05-10", weight: 26,
  })

  const petsToCreate = [
    { name: "Luna", species: "Cat", breed: "Persian", gender: "Female", date_of_birth: "2023-08-15", weight: 4.2 },
    { name: "Max", species: "Dog", breed: "Golden Retriever", gender: "Male", date_of_birth: "2020-03-02", weight: 28 },
    { name: "Coco", species: "Dog", breed: "Beagle", gender: "Female", date_of_birth: "2022-11-20", weight: 11 },
  ]

  const pets = { Bruno: bruno }
  for (const pet of petsToCreate) {
    const { row, created } = await ensurePet(ownerProfile.id, pet)
    if (created) summary.petsCreated += 1
    pets[pet.name] = row
  }

  const appointmentDefs = [
    { key: "a1", pet: pets.Bruno, doctor: drAnanya, service: "General Consultation", consultation_type: "online", appointment_date: isoDateOffset(3), appointment_time: "10:30:00", status: "confirmed" },
    { key: "a2", pet: pets.Luna, doctor: drMeera, service: "Dermatology Consultation", consultation_type: "clinic", appointment_date: isoDateOffset(5), appointment_time: "14:00:00", status: "confirmed" },
    { key: "a3", pet: pets.Max, doctor: drRahul, service: "General Health Check", consultation_type: "clinic", appointment_date: isoDateOffset(7), appointment_time: "11:00:00", status: "pending" },
    { key: "a4", pet: pets.Bruno, doctor: drAnanya, service: "Vaccination Follow-up", consultation_type: "clinic", appointment_date: isoDateOffset(-14), appointment_time: "09:30:00", status: "completed" },
    { key: "a5", pet: pets.Coco, doctor: drMeera, service: "Skin Consultation", consultation_type: "clinic", appointment_date: isoDateOffset(-7), appointment_time: "16:00:00", status: "cancelled" },
  ]

  const appointments = {}
  for (const def of appointmentDefs) {
    const { row, created } = await ensureAppointment({
      owner_id: ownerProfile.id,
      pet_id: def.pet.id,
      doctor_id: def.doctor.id,
      service: def.service,
      consultation_type: def.consultation_type,
      appointment_date: def.appointment_date,
      appointment_time: def.appointment_time,
      status: def.status,
    })
    if (created) summary.appointmentsCreated += 1
    appointments[def.key] = row
  }

  const { created: recordCreated } = await ensureMedicalRecord({
    pet_id: pets.Bruno.id,
    doctor_id: drAnanya.id,
    appointment_id: appointments.a4.id,
    symptoms: "Routine health check",
    clinical_notes: "Patient alert and active. No abnormal findings during general examination.",
    diagnosis: "Healthy adult dog",
    treatment: "Continue routine preventive care.",
    prescription: [],
    vitals: { weight: 26, temperature: 38.3, heart_rate: 92 },
  })
  if (recordCreated) summary.medicalRecordsCreated += 1

  console.log("\n=== SEED SUMMARY ===")
  console.log(JSON.stringify(summary, null, 2))

  if (credentials.length) {
    console.log("\n=== TEMPORARY PASSWORDS (shown once, not stored in plaintext anywhere) ===")
    credentials.forEach(({ email, password, role }) => console.log(`${email} (${role}): ${password}`))
  }

  console.log("\nDone. No existing rows were modified or deleted.")
  await pool.end()
}

main().catch((err) => {
  console.error("Seed failed:", err.message)
  process.exit(1)
})
