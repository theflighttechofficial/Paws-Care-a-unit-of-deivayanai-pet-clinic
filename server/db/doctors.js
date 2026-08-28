import { pool } from "../config/db.js"

const DOCTOR_WITH_PROFILE_SELECT = `
  select
    d.id, d.profile_id, d.specialization, d.experience, d.bio, d.availability,
    d.created_at, d.updated_at,
    p.full_name, p.avatar_url, p.email as profile_email
  from public.doctors d
  join public.profiles p on p.id = d.profile_id
`

const shapeDoctorRow = (row) => ({
  id: row.id,
  profile_id: row.profile_id,
  specialization: row.specialization,
  experience: row.experience,
  bio: row.bio,
  availability: row.availability,
  created_at: row.created_at,
  updated_at: row.updated_at,
  profile: {
    id: row.profile_id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    email: row.profile_email,
  },
})

export const listDoctors = async () => {
  const { rows } = await pool.query(`${DOCTOR_WITH_PROFILE_SELECT} order by d.created_at asc`)
  return rows.map(shapeDoctorRow)
}

export const findDoctorById = async (id) => {
  const { rows } = await pool.query(`${DOCTOR_WITH_PROFILE_SELECT} where d.id = $1`, [id])
  return rows[0] ? shapeDoctorRow(rows[0]) : null
}

export const findDoctorByProfileId = async (profileId) => {
  const { rows } = await pool.query(`${DOCTOR_WITH_PROFILE_SELECT} where d.profile_id = $1`, [profileId])
  return rows[0] ? shapeDoctorRow(rows[0]) : null
}

export const countDoctors = async () => {
  const { rows } = await pool.query("select count(*)::int as count from public.doctors")
  return rows[0].count
}
