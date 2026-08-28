import { pool } from "../config/db.js"

const RECORD_SELECT = `
  select
    r.*,
    d.id as doctor_id_full,
    d.specialization as doctor_specialization,
    d.experience as doctor_experience,
    d.bio as doctor_bio,
    dp.id as doctor_profile_id,
    dp.full_name as doctor_full_name,
    dp.avatar_url as doctor_avatar_url,
    dp.email as doctor_email
  from public.medical_records r
  join public.doctors d on d.id = r.doctor_id
  join public.profiles dp on dp.id = d.profile_id
`

const shapeRecordRow = (row) => ({
  id: row.id,
  pet_id: row.pet_id,
  doctor_id: row.doctor_id,
  appointment_id: row.appointment_id,
  symptoms: row.symptoms,
  clinical_notes: row.clinical_notes,
  diagnosis: row.diagnosis,
  treatment: row.treatment,
  prescription: row.prescription,
  vitals: row.vitals,
  created_at: row.created_at,
  updated_at: row.updated_at,
  doctor: {
    id: row.doctor_id_full,
    profile_id: row.doctor_profile_id,
    specialization: row.doctor_specialization,
    experience: row.doctor_experience,
    bio: row.doctor_bio,
    profile: {
      id: row.doctor_profile_id,
      full_name: row.doctor_full_name,
      avatar_url: row.doctor_avatar_url,
      email: row.doctor_email,
    },
  },
})

export const listRecordsByPet = async (petId) => {
  const { rows } = await pool.query(
    `${RECORD_SELECT} where r.pet_id = $1 order by r.created_at desc`,
    [petId]
  )
  return rows.map(shapeRecordRow)
}

export const findRecordByAppointmentId = async (appointmentId) => {
  const { rows } = await pool.query(
    "select id from public.medical_records where appointment_id = $1",
    [appointmentId]
  )
  return rows[0] || null
}

export const upsertRecordForAppointment = async ({ petId, doctorId, appointmentId, symptoms, clinicalNotes, diagnosis, treatment, prescription, vitals }) => {
  const existing = await findRecordByAppointmentId(appointmentId)

  if (existing) {
    await pool.query(
      `update public.medical_records set
        pet_id = $2, doctor_id = $3, symptoms = $4, clinical_notes = $5,
        diagnosis = $6, treatment = $7, prescription = $8, vitals = $9
       where id = $1`,
      [existing.id, petId, doctorId, symptoms, clinicalNotes, diagnosis, treatment, JSON.stringify(prescription), JSON.stringify(vitals)]
    )
    const { rows } = await pool.query(`${RECORD_SELECT} where r.id = $1`, [existing.id])
    return shapeRecordRow(rows[0])
  }

  const { rows } = await pool.query(
    `insert into public.medical_records
      (pet_id, doctor_id, appointment_id, symptoms, clinical_notes, diagnosis, treatment, prescription, vitals)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [petId, doctorId, appointmentId, symptoms, clinicalNotes, diagnosis, treatment, JSON.stringify(prescription), JSON.stringify(vitals)]
  )
  const { rows: withDoctor } = await pool.query(`${RECORD_SELECT} where r.id = $1`, [rows[0].id])
  return shapeRecordRow(withDoctor[0])
}
