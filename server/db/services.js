import { pool } from "../config/db.js"

const DEFAULT_SERVICES = [
  { slug: "general", title: "General Consultation", description: "Routine checkups, symptoms, general health concerns and vaccinations.", duration_minutes: 30, price_inr: 600, icon: "stethoscope", phone_only: false, sort_order: 1 },
  { slug: "dental", title: "Dental Care", description: "Dental examination, cleaning and oral health.", duration_minutes: 30, price_inr: 800, icon: "pawprint", phone_only: false, sort_order: 2 },
  { slug: "skincare", title: "Skincare", description: "Skin examination, allergies and dermatological treatment.", duration_minutes: 30, price_inr: 650, icon: "heart", phone_only: false, sort_order: 3 },
  { slug: "followup", title: "Follow-up", description: "Review an existing condition or previous consultation.", duration_minutes: 20, price_inr: 400, icon: "calendar", phone_only: false, sort_order: 4 },
  { slug: "surgery", title: "Surgery", description: "Surgical procedures need a phone consultation first — no online slot booking.", duration_minutes: null, price_inr: null, icon: "scissors", phone_only: true, sort_order: 5 },
]

// Idempotent bootstrap so existing databases (created before this table
// existed) pick it up automatically without a manual migration step.
export const ensureServicesTable = async () => {
  await pool.query(`
    create table if not exists public.services (
      id uuid primary key default gen_random_uuid(),
      slug text not null unique,
      title text not null,
      description text,
      duration_minutes integer,
      price_inr integer,
      icon text not null default 'stethoscope',
      phone_only boolean not null default false,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  const { rows } = await pool.query("select count(*)::int as count from public.services")
  if (rows[0].count > 0) return

  for (const service of DEFAULT_SERVICES) {
    await pool.query(
      `insert into public.services (slug, title, description, duration_minutes, price_inr, icon, phone_only, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (slug) do nothing`,
      [service.slug, service.title, service.description, service.duration_minutes, service.price_inr, service.icon, service.phone_only, service.sort_order]
    )
  }
}

export const listServices = async () => {
  const { rows } = await pool.query("select * from public.services order by sort_order asc, created_at asc")
  return rows
}

export const findServiceById = async (id) => {
  const { rows } = await pool.query("select * from public.services where id = $1", [id])
  return rows[0] || null
}

export const createService = async (payload) => {
  const { rows } = await pool.query(
    `insert into public.services (slug, title, description, duration_minutes, price_inr, icon, phone_only, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      payload.slug,
      payload.title,
      payload.description || null,
      payload.phone_only ? null : payload.duration_minutes ?? null,
      payload.phone_only ? null : payload.price_inr ?? null,
      payload.icon || "stethoscope",
      Boolean(payload.phone_only),
      payload.sort_order ?? 0,
    ]
  )
  return rows[0]
}

export const updateService = async (id, payload) => {
  const { rows } = await pool.query(
    `update public.services set
      title = coalesce($2, title),
      description = $3,
      duration_minutes = $4,
      price_inr = $5,
      icon = coalesce($6, icon),
      phone_only = coalesce($7, phone_only),
      sort_order = coalesce($8, sort_order),
      updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      payload.title,
      payload.description ?? null,
      payload.phone_only ? null : payload.duration_minutes ?? null,
      payload.phone_only ? null : payload.price_inr ?? null,
      payload.icon,
      payload.phone_only,
      payload.sort_order,
    ]
  )
  return rows[0] || null
}

export const deleteService = async (id) => {
  const { rows } = await pool.query("delete from public.services where id = $1 returning id", [id])
  return rows[0] || null
}
