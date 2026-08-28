import pg from "pg"
import dotenv from "dotenv"

// Must run before the Pool below reads process.env.DATABASE_URL — ESM
// imports are evaluated before the importing module's own top-level code,
// so relying on the importer (server.js, scripts/*) to call dotenv.config()
// first is not safe.
dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
})

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.")
    return null
  }

  try {
    const client = await pool.connect()
    const result = await client.query("select now()")
    client.release()
    console.log(`Postgres connected: ${result.rows[0].now}`)
    return pool
  } catch (error) {
    console.error("Postgres connection failed:", error.message)
    return null
  }
}

export default connectDB
