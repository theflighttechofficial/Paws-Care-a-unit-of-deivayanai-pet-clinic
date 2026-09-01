import connectDB from "./config/db.js"
import app from "./app.js"
import { sendDueReminders } from "./jobs/appointmentReminders.js"

const PORT = process.env.PORT || 5000
const REMINDER_INTERVAL_MS = 15 * 60 * 1000

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

  // No external cron infra here, so a simple in-process interval polls for
  // appointments starting within 24h and emails a reminder.
  const runReminders = () => {
    sendDueReminders().catch((error) => console.error("Appointment reminder job failed:", error))
  }
  runReminders()
  setInterval(runReminders, REMINDER_INTERVAL_MS)
}

startServer()
