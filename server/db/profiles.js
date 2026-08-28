import { pool } from "../config/db.js"

export const findProfileByEmail = async (email) => {
  const { rows } = await pool.query("select * from public.profiles where email = $1", [email.toLowerCase()])
  return rows[0] || null
}

export const findProfileById = async (id) => {
  const { rows } = await pool.query("select * from public.profiles where id = $1", [id])
  return rows[0] || null
}

export const createProfile = async ({ email, passwordHash, fullName, phone, role }) => {
  const { rows } = await pool.query(
    `insert into public.profiles (email, password_hash, full_name, phone, role)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [email.toLowerCase(), passwordHash, fullName, phone || null, role || "owner"]
  )
  return rows[0]
}

export const countProfilesByRole = async (role) => {
  const { rows } = await pool.query("select count(*)::int as count from public.profiles where role = $1", [role])
  return rows[0].count
}

export const setResetToken = async (profileId, tokenHash, expiresAt) => {
  await pool.query(
    "update public.profiles set reset_token_hash = $1, reset_token_expires = $2, updated_at = now() where id = $3",
    [tokenHash, expiresAt, profileId]
  )
}

export const findProfileByResetTokenHash = async (tokenHash) => {
  const { rows } = await pool.query(
    "select * from public.profiles where reset_token_hash = $1 and reset_token_expires > now()",
    [tokenHash]
  )
  return rows[0] || null
}

export const resetPasswordAndClearToken = async (profileId, passwordHash) => {
  await pool.query(
    `update public.profiles
     set password_hash = $1, reset_token_hash = null, reset_token_expires = null, updated_at = now()
     where id = $2`,
    [passwordHash, profileId]
  )
}
