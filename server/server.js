import connectDB from "./config/db.js"
import app from "./app.js"

const PORT = process.env.PORT || 5000

const startServer = async () => {
  const connection = await connectDB()

  // Do not accept requests until Postgres is reachable — a valid request
  // hitting a dead pool would otherwise surface as a confusing 500.
  if (!connection) {
    console.error("Server was not started because Postgres is unavailable. Check DATABASE_URL.")
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer()
