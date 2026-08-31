import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import adminRoutes from "./routes/adminRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import appointmentRoutes from "./routes/appointmentRoutes.js"
import leaveRoutes from "./routes/leaveRoutes.js"
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import petRoutes from "./routes/petRoutes.js"
import { googleOAuthCallback } from "./controllers/googleAuthController.js"
import { getGoogleCalendarStatus } from "./lib/googleCalendar.js"

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
)

app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/leaves", leaveRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/medical-records", medicalRecordRoutes)
app.use("/api/pets", petRoutes)

// Hit directly by Google's OAuth redirect — must stay outside the
// JWT-protected /api/admin router (no Authorization header is available
// on a browser redirect).
app.get("/api/google/oauth/callback", googleOAuthCallback)

// Health check
app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    message: "Paws & Care API is running 🐾",
    googleCalendar: await getGoogleCalendarStatus(),
  })
})

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error("API error:", error)
  res.status(500).json({ message: "Something went wrong. Please try again." })
})

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
