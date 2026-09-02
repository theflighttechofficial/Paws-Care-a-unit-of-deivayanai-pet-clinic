import jwt from "jsonwebtoken"
import { clearConnection, upsertConnection } from "../db/googleAuth.js"
import { buildGoogleOAuthClient, verifyGoogleConnection } from "../lib/googleCalendar.js"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
]

// Only an authenticated admin (checked by the `protect`+`requireRole`
// middleware on this route) can obtain this URL — the browser then does a
// full-page redirect to it, since Google's consent screen can't be reached
// via a fetch() call.
export const startGoogleConnect = (req, res) => {
  const state = jwt.sign({ purpose: "google-oauth-connect" }, process.env.JWT_SECRET, { expiresIn: "10m" })

  const oauth2Client = buildGoogleOAuthClient()
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    // Forces Google to re-issue a refresh token even if this account
    // connected before (Google only returns one on first-ever consent
    // otherwise).
    prompt: "consent",
    scope: SCOPES,
    state,
  })

  return res.json({ url })
}

const decodeIdTokenEmail = (idToken) => {
  try {
    const payload = idToken.split(".")[1]
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    return decoded.email || null
  } catch {
    return null
  }
}

// Hit directly by Google's redirect (no Authorization header available),
// so this route is intentionally NOT behind our JWT `protect` middleware.
// The signed, short-lived `state` value is what prevents this endpoint
// from accepting a forged callback.
export const googleOAuthCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

  try {
    const { code, state } = req.query

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/admin/settings?google=error&reason=missing_code`)
    }

    jwt.verify(state, process.env.JWT_SECRET)

    const oauth2Client = buildGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return res.redirect(`${frontendUrl}/admin/settings?google=error&reason=no_refresh_token`)
    }

    const email = tokens.id_token ? decodeIdTokenEmail(tokens.id_token) : null

    await upsertConnection({
      connectedEmail: email,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token || null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    })

    return res.redirect(`${frontendUrl}/admin/settings?google=connected`)
  } catch (error) {
    console.error("Google OAuth callback failed:", error.message)
    return res.redirect(`${frontendUrl}/admin/settings?google=error`)
  }
}

export const getGoogleConnectionStatus = async (req, res) => {
  const status = await verifyGoogleConnection()

  // A stored refresh token that Google no longer honors (revoked, or the
  // consent expired) is as good as disconnected — clear it so the admin
  // sees an accurate "not connected" state instead of a stale "Connected"
  // that silently fails on every booking.
  if (!status.connected && status.email) {
    await clearConnection()
  }

  return res.json({
    connected: status.connected,
    email: status.connected ? status.email : null,
    error: status.error || null,
  })
}

export const disconnectGoogle = async (req, res) => {
  await clearConnection()
  return res.json({ message: "Google Calendar disconnected." })
}
