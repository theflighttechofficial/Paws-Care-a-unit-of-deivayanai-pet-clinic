import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, "..", "dist")

const app = express()

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean),
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

// Serve the built React app (dist/) so a single server can handle both the
// API and the frontend — this is only populated after `npm run build`.
// Registered after every /api/* route so unmatched API paths still 404
// correctly instead of falling through to the SPA shell.
app.use(express.static(distDir))

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next()
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) next(error)
  })
})

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error("API error:", error)
  res.status(500).json({ message: "Something went wrong. Please try again." })
})

export default app
