import { getConnection, markDisconnectAlertSent } from "../db/googleAuth.js"
import { verifyGoogleConnection } from "../lib/googleCalendar.js"
import { sendCustomEmail } from "../lib/mailer.js"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "umasubramanian81@gmail.com"

// Polled alongside the reminder job — no page visit required to notice a
// dead connection. Sends one alert per disconnect event (disconnect_alert_sent
// flag), reset automatically on the next successful reconnect via upsertConnection.
export const checkGoogleCalendarConnection = async () => {
  const connection = await getConnection()
  if (!connection?.refresh_token) return // never connected, or already cleared — nothing to alert on

  const status = await verifyGoogleConnection()
  if (status.connected || connection.disconnect_alert_sent) return

  try {
    await sendCustomEmail({
      to: ADMIN_EMAIL,
      subject: "Paws & Care — Google Calendar disconnected",
      message: `Google Calendar sync has stopped working.\n\nAccount: ${connection.connected_email || "unknown"}\nError: ${status.error || "refresh token no longer valid"}\n\nReconnect it from Admin -> Settings.`,
    })
    await markDisconnectAlertSent()
  } catch (error) {
    console.error("Failed to send Google Calendar disconnect alert:", error.message)
  }
}
