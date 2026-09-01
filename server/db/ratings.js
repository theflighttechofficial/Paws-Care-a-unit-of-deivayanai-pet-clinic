import { pool } from "../config/db.js"

// Idempotent bootstrap, same pattern as services/payments — safe to run on
// every server start against a database that may predate this table.
export const ensureRatingsTable = async () => {
  await pool.query(`
    create table if not exists public.appointment_ratings (
      id uuid primary key default gen_random_uuid(),
      appointment_id uuid not null unique references public.appointments(id) on delete cascade,
      owner_id uuid not null references public.profiles(id) on delete cascade,
      rating integer not null check (rating between 1 and 5),
      feedback text,
      created_at timestamptz not null default now()
    )
  `)
}

export const createOrUpdateRating = async ({ appointmentId, ownerId, rating, feedback }) => {
  const { rows } = await pool.query(
    `insert into public.appointment_ratings (appointment_id, owner_id, rating, feedback)
     values ($1, $2, $3, $4)
     on conflict (appointment_id) do update set rating = excluded.rating, feedback = excluded.feedback
     returning *`,
    [appointmentId, ownerId, rating, feedback || null]
  )
  return rows[0]
}

export const findRatingByAppointment = async (appointmentId) => {
  const { rows } = await pool.query("select * from public.appointment_ratings where appointment_id = $1", [appointmentId])
  return rows[0] || null
}

export const listAllRatings = async () => {
  const { rows } = await pool.query(`
    select
      r.*,
      a.service,
      a.appointment_date,
      a.appointment_time,
      row_to_json(pt.*) as pet,
      json_build_object('id', op.id, 'full_name', op.full_name, 'email', op.email) as owner,
      dp.full_name as doctor_name
    from public.appointment_ratings r
    join public.appointments a on a.id = r.appointment_id
    join public.pets pt on pt.id = a.pet_id
    join public.profiles op on op.id = r.owner_id
    join public.doctors d on d.id = a.doctor_id
    join public.profiles dp on dp.id = d.profile_id
    order by r.created_at desc
  `)
  return rows
}
