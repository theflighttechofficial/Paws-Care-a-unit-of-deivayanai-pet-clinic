import { pool } from "../config/db.js"

const APPOINTMENT_SELECT = `
  select
    a.*,
    row_to_json(pt.*) as pet,
    json_build_object(
      'id', op.id,
      'full_name', op.full_name,
      'email', op.email,
      'phone', op.phone,
      'avatar_url', op.avatar_url
    ) as owner,
    d.id as doctor_id_full,
    d.specialization as doctor_specialization,
    d.experience as doctor_experience,
    d.bio as doctor_bio,
    d.availability as doctor_availability,
    dp.id as doctor_profile_id,
    dp.full_name as doctor_full_name,
    dp.avatar_url as doctor_avatar_url,
    dp.email as doctor_email
  from public.appointments a
  join public.pets pt on pt.id = a.pet_id
  join public.profiles op on op.id = a.owner_id
  join public.doctors d on d.id = a.doctor_id
  join public.profiles dp on dp.id = d.profile_id
`

const shapeAppointmentRow = (row) => ({
  id: row.id,
  owner_id: row.owner_id,
  pet_id: row.pet_id,
  doctor_id: row.doctor_id,
  service: row.service,
  consultation_type: row.consultation_type,
  appointment_date: row.appointment_date,
  appointment_time: row.appointment_time,
  duration: row.duration,
  status: row.status,
  google_calendar_event_id: row.google_calendar_event_id,
  google_meet_url: row.google_meet_url,
  google_sync_status: row.google_sync_status,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
  pet: row.pet,
  owner: row.owner,
  doctor: {
    id: row.doctor_id_full,
    profile_id: row.doctor_profile_id,
    specialization: row.doctor_specialization,
    experience: row.doctor_experience,
    bio: row.doctor_bio,
    availability: row.doctor_availability,
    profile: {
      id: row.doctor_profile_id,
      full_name: row.doctor_full_name,
      avatar_url: row.doctor_avatar_url,
      email: row.doctor_email,
    },
  },
})

export const listAppointmentsByOwner = async (ownerId) => {
  const { rows } = await pool.query(
    `${APPOINTMENT_SELECT} where a.owner_id = $1 order by a.appointment_date asc, a.appointment_time asc`,
    [ownerId]
  )
  return rows.map(shapeAppointmentRow)
}

export const listAppointmentsByDoctor = async (doctorId) => {
  const { rows } = await pool.query(
    `${APPOINTMENT_SELECT} where a.doctor_id = $1 order by a.appointment_date asc, a.appointment_time asc`,
    [doctorId]
  )
  return rows.map(shapeAppointmentRow)
}

export const listAppointmentsByOwnerAndPet = async (ownerId, petId) => {
  const { rows } = await pool.query(
    `${APPOINTMENT_SELECT} where a.owner_id = $1 and a.pet_id = $2 order by a.appointment_date desc, a.appointment_time desc`,
    [ownerId, petId]
  )
  return rows.map(shapeAppointmentRow)
}

export const listAllAppointments = async () => {
  const { rows } = await pool.query(
    `${APPOINTMENT_SELECT} order by a.appointment_date asc, a.appointment_time asc`
  )
  return rows.map(shapeAppointmentRow)
}

export const findAppointmentById = async (id) => {
  const { rows } = await pool.query(`${APPOINTMENT_SELECT} where a.id = $1`, [id])
  return rows[0] ? shapeAppointmentRow(rows[0]) : null
}

export const listBookedTimesForDoctorDate = async (doctorId, date) => {
  const { rows } = await pool.query(
    `select appointment_time from public.appointments
     where doctor_id = $1 and appointment_date = $2 and status <> 'cancelled'`,
    [doctorId, date]
  )
  return rows.map((row) => row.appointment_time)
}

export const findConflictingSlot = async (doctorId, date, time) => {
  const { rows } = await pool.query(
    `select id from public.appointments
     where doctor_id = $1 and appointment_date = $2 and appointment_time = $3 and status <> 'cancelled'`,
    [doctorId, date, time]
  )
  return rows[0] || null
}

export const createAppointment = async ({ ownerId, petId, doctorId, service, consultationType, date, time }) => {
  const { rows } = await pool.query(
    `insert into public.appointments
      (owner_id, pet_id, doctor_id, service, consultation_type, appointment_date, appointment_time, duration, status)
     values ($1, $2, $3, $4, $5, $6, $7, 30, 'pending')
     returning id`,
    [ownerId, petId, doctorId, service, consultationType, date, time]
  )
  return findAppointmentById(rows[0].id)
}

export const updateAppointmentStatus = async (id, status) => {
  const { rows } = await pool.query(
    "update public.appointments set status = $2 where id = $1 returning id",
    [id, status]
  )
  if (!rows[0]) return null
  return findAppointmentById(id)
}

export const setGoogleCalendarInfo = async (id, { eventId, meetLink }) => {
  await pool.query(
    "update public.appointments set google_calendar_event_id = $2, google_meet_url = $3 where id = $1",
    [id, eventId || null, meetLink || null]
  )
  return findAppointmentById(id)
}

export const countAppointments = async () => {
  const { rows } = await pool.query("select count(*)::int as count from public.appointments")
  return rows[0].count
}

export const countAppointmentsToday = async () => {
  const { rows } = await pool.query(
    "select count(*)::int as count from public.appointments where appointment_date = current_date"
  )
  return rows[0].count
}

export const countAppointmentsByStatus = async (status) => {
  const { rows } = await pool.query(
    "select count(*)::int as count from public.appointments where status = $1",
    [status]
  )
  return rows[0].count
}
