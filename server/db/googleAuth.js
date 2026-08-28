import { pool } from "../config/db.js"

export const getConnection = async () => {
  const { rows } = await pool.query("select * from public.google_calendar_connection where id = true")
  return rows[0] || null
}

export const upsertConnection = async ({ connectedEmail, refreshToken, accessToken, tokenExpiry }) => {
  const { rows } = await pool.query(
    `insert into public.google_calendar_connection (id, connected_email, refresh_token, access_token, token_expiry)
     values (true, $1, $2, $3, $4)
     on conflict (id) do update set
       connected_email = excluded.connected_email,
       refresh_token = excluded.refresh_token,
       access_token = excluded.access_token,
       token_expiry = excluded.token_expiry
     returning *`,
    [connectedEmail, refreshToken, accessToken, tokenExpiry]
  )
  return rows[0]
}

export const updateAccessToken = async ({ accessToken, tokenExpiry }) => {
  await pool.query(
    "update public.google_calendar_connection set access_token = $1, token_expiry = $2 where id = true",
    [accessToken, tokenExpiry]
  )
}

export const clearConnection = async () => {
  await pool.query("delete from public.google_calendar_connection where id = true")
}
