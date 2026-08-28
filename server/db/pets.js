import { pool } from "../config/db.js"

export const listPetsByOwner = async (ownerId) => {
  const { rows } = await pool.query(
    "select * from public.pets where owner_id = $1 order by created_at desc",
    [ownerId]
  )
  return rows
}

export const findPetByIdForOwner = async (id, ownerId) => {
  const { rows } = await pool.query(
    "select * from public.pets where id = $1 and owner_id = $2",
    [id, ownerId]
  )
  return rows[0] || null
}

export const createPet = async (ownerId, payload) => {
  const { rows } = await pool.query(
    `insert into public.pets
      (owner_id, name, species, breed, gender, date_of_birth, weight, color, microchip_id, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning *`,
    [
      ownerId,
      payload.name,
      payload.species,
      payload.breed || null,
      payload.gender || null,
      payload.date_of_birth || null,
      payload.weight ?? null,
      payload.color || null,
      payload.microchip_id || null,
      payload.notes || null,
    ]
  )
  return rows[0]
}

export const updatePet = async (id, ownerId, payload) => {
  const { rows } = await pool.query(
    `update public.pets set
      name = coalesce($3, name),
      species = coalesce($4, species),
      breed = coalesce($5, breed),
      gender = coalesce($6, gender),
      date_of_birth = $7,
      weight = $8,
      color = $9,
      microchip_id = $10,
      notes = $11
     where id = $1 and owner_id = $2
     returning *`,
    [
      id,
      ownerId,
      payload.name,
      payload.species,
      payload.breed,
      payload.gender,
      payload.date_of_birth || null,
      payload.weight ?? null,
      payload.color,
      payload.microchip_id,
      payload.notes,
    ]
  )
  return rows[0] || null
}

export const deletePet = async (id, ownerId) => {
  const { rows } = await pool.query(
    "delete from public.pets where id = $1 and owner_id = $2 returning id",
    [id, ownerId]
  )
  return rows[0] || null
}

export const countPets = async () => {
  const { rows } = await pool.query("select count(*)::int as count from public.pets")
  return rows[0].count
}

export const listAllPetsWithOwners = async () => {
  const { rows } = await pool.query(`
    select
      p.*,
      json_build_object('id', o.id, 'full_name', o.full_name, 'email', o.email, 'phone', o.phone) as owner
    from public.pets p
    join public.profiles o on o.id = p.owner_id
    order by p.created_at desc
  `)
  return rows
}
