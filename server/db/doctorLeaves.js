import { pool } from "../config/db.js"

// leave_date is cast to text in SQL rather than left as Postgres's `date`
// type — node-pg otherwise hands back a JS Date at local midnight, which
// serializes to a UTC ISO string and can shift a day depending on the
// server/browser timezone. A plain "YYYY-MM-DD" string round-trips exactly.
export const listLeavesForDoctor = async (doctorId) => {
  const { rows } = await pool.query(
    `select id, doctor_id, leave_date::text as leave_date, reason, created_at
     from public.doctor_leaves
     where doctor_id = $1 and leave_date >= current_date
     order by leave_date asc`,
    [doctorId]
  )
  return rows
}

export const listAllUpcomingLeaves = async () => {
  const { rows } = await pool.query(
    `select l.id, l.doctor_id, l.leave_date::text as leave_date, l.reason, l.created_at, p.full_name as doctor_name
     from public.doctor_leaves l
     join public.doctors d on d.id = l.doctor_id
     join public.profiles p on p.id = d.profile_id
     where l.leave_date >= current_date
     order by l.leave_date asc`
  )
  return rows
}

export const isDoctorOnLeave = async (doctorId, date) => {
  const { rows } = await pool.query(
    "select 1 from public.doctor_leaves where doctor_id = $1 and leave_date = $2",
    [doctorId, date]
  )
  return rows.length > 0
}

export const addLeave = async (doctorId, date, reason) => {
  const { rows } = await pool.query(
    `insert into public.doctor_leaves (doctor_id, leave_date, reason)
     values ($1, $2, $3)
     on conflict (doctor_id, leave_date) do update set reason = excluded.reason
     returning id, doctor_id, leave_date::text as leave_date, reason, created_at`,
    [doctorId, date, reason || null]
  )
  return rows[0]
}

export const removeLeaveByDate = async (doctorId, date) => {
  await pool.query("delete from public.doctor_leaves where doctor_id = $1 and leave_date = $2", [doctorId, date])
}

export const removeLeaveById = async (id) => {
  await pool.query("delete from public.doctor_leaves where id = $1", [id])
}
