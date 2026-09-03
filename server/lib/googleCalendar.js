import { google } from "googleapis"
import { getConnection, updateAccessToken } from "../db/googleAuth.js"

// Asia/Kolkata never observes DST, so a fixed UTC offset is safe here.
// This MUST match CLINIC_TIMEZONE (default "Asia/Kolkata") — if the clinic
// ever operates in a different zone, update both together.
const CLINIC_UTC_OFFSET = "+05:30"

// Pulls the plain "YYYY-MM-DD" out of either a JS Date or a date string.
// node-postgres decodes a `date` column via the LOCAL Date constructor
// (new Date(year, month, day) in the server process's own timezone), not
// UTC — so reading it back must use the matching local getters, not
// toISOString(), or the date silently shifts by a day on any server whose
// process timezone sits ahead of UTC (as IST does).
const dateKeyOf = (baseDate) => {
  if (baseDate instanceof Date) {
    const y = baseDate.getFullYear()
    const m = String(baseDate.getMonth() + 1).padStart(2, "0")
    const d = String(baseDate.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  return String(baseDate).slice(0, 10)
}

export const parseTimeString = (timeValue, baseDate) => {
  if (!timeValue || typeof timeValue !== "string") {
    return null
  }

  const normalized = timeValue.trim()
  let hours
  let minutes

  // Postgres `time` columns are always returned as 24-hour "HH:MM" or
  // "HH:MM:SS" (e.g. "15:15:00"), never with an AM/PM suffix.
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (twentyFourHour) {
    hours = Number(twentyFourHour[1])
    minutes = Number(twentyFourHour[2])
    if (hours > 23 || minutes > 59) return null
  } else {
    // Fall back to accepting a 12-hour "10:30 AM" string, in case a caller
    // ever passes one directly.
    const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
    if (!twelveHour) return null

    hours = Number(twelveHour[1])
    minutes = Number(twelveHour[2])
    const meridiem = twelveHour[3].toUpperCase()

    if (hours === 12) {
      hours = meridiem === "AM" ? 0 : 12
    } else if (meridiem === "PM") {
      hours += 12
    }
  }

  // Built with an explicit offset (not Date.setHours, which uses the
  // server process's OS timezone) so the resulting instant is correct
  // regardless of what timezone the server happens to run in — this is
  // what was silently shifting booked times in production, where the host
  // runs in UTC rather than IST.
  const hh = String(hours).padStart(2, "0")
  const mm = String(minutes).padStart(2, "0")
  return new Date(`${dateKeyOf(baseDate)}T${hh}:${mm}:00${CLINIC_UTC_OFFSET}`)
}

export const buildGoogleOAuthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  )

const buildAuthorizedClient = (connection) => {
  const oauth2Client = buildGoogleOAuthClient()
  oauth2Client.setCredentials({
    refresh_token: connection.refresh_token,
    access_token: connection.access_token,
    expiry_date: connection.token_expiry ? new Date(connection.token_expiry).getTime() : undefined,
  })

  // googleapis auto-refreshes the access token using the refresh token
  // when it's expired; persist the refreshed token so we don't hit Google
  // on every single request.
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      updateAccessToken({
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      }).catch((error) => console.error("Failed to persist refreshed Google access token:", error.message))
    }
  })

  return oauth2Client
}

export const isGoogleCalendarConfigured = async () => {
  const connection = await getConnection()
  return Boolean(connection?.refresh_token)
}

// Unlike isGoogleCalendarConfigured/getGoogleCalendarStatus (which only
// check that a refresh token is stored), this actually calls Google to
// confirm that token still works — a revoked/expired refresh token
// otherwise leaves the admin Settings page showing "Connected" forever
// even though every real sync has been silently failing.
export const verifyGoogleConnection = async () => {
  const connection = await getConnection()
  if (!connection?.refresh_token) {
    return { connected: false, email: null }
  }

  try {
    const oauth2Client = buildAuthorizedClient(connection)
    await oauth2Client.getAccessToken()
    return { connected: true, email: connection.connected_email || null }
  } catch (error) {
    console.warn("Stored Google Calendar connection is no longer valid:", error.message)
    return { connected: false, email: connection.connected_email || null, error: error.message }
  }
}

export const getGoogleCalendarStatus = async () => {
  const connection = await getConnection()

  if (!connection?.refresh_token) {
    return {
      configured: false,
      message: "Google Calendar is not connected yet. An admin needs to connect it from Settings.",
    }
  }

  return {
    configured: true,
    message: `Google Calendar is connected (${connection.connected_email || "unknown account"}).`,
  }
}

// The site lists two branches (Porur and Iyyapanthangal, Chennai) with no
// per-booking branch selection today, so a single precise street address
// can't be attributed correctly — this points recipients to both via the
// clinic's own numbers instead of guessing one.
const CLINIC_ADDRESS = "Deivayanai Pet Clinic — Porur or Iyyapanthangal, Chennai, Tamil Nadu (call to confirm your branch)"

const isValidEmail = (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const typeLabel = (type) => (type === "online" ? "Online" : type === "phone" ? "Phone" : "In-person")

export async function createGoogleCalendarEventForAppointment(appointment) {
  // The owner is the whole point of the invite — if their email is
  // missing or malformed, don't attempt the event at all rather than
  // silently create one nobody useful is invited to.
  if (!isValidEmail(appointment.owner?.email)) {
    console.warn("Skipping Google Calendar sync: owner email is missing or invalid.", {
      ownerEmail: appointment.owner?.email,
    })
    return {
      configured: true,
      eventId: null,
      meetLink: null,
      message: "Calendar invite skipped: the owner's email address is missing or invalid.",
    }
  }

  const connection = await getConnection()

  if (!connection?.refresh_token) {
    return {
      configured: false,
      eventId: null,
      meetLink: null,
      message: "Google Calendar is not connected yet. An admin needs to connect it from Settings.",
    }
  }

  try {
    const oauth2Client = buildAuthorizedClient(connection)
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    const timeZone = process.env.CLINIC_TIMEZONE || "Asia/Kolkata"
    const baseDate = new Date(appointment.date)
    const startDateTime = parseTimeString(appointment.startTime, baseDate)
    const durationMinutes = Number(appointment.duration) > 0 ? Number(appointment.duration) : 30
    const endDateTime = startDateTime ? new Date(startDateTime.getTime() + durationMinutes * 60000) : null

    if (!startDateTime || !endDateTime) {
      return {
        configured: true,
        eventId: null,
        meetLink: null,
        message: "Appointment time was invalid; Google Calendar sync was skipped.",
      }
    }

    const attendees = [{ email: appointment.owner.email }]
    if (isValidEmail(appointment.doctor?.email)) attendees.push({ email: appointment.doctor.email })

    const isOnline = appointment.type === "online"
    const ownerFirstName = (appointment.owner?.name || "Pet parent").trim().split(/\s+/)[0]

    const descriptionLines = [
      `Paws & Care veterinary clinic appointment`,
      `Service: ${appointment.service || "Consultation"}`,
      `Type: ${typeLabel(appointment.type)}`,
      `Doctor: ${appointment.doctor?.name || "Veterinarian"}`,
      `Owner: ${appointment.owner?.name || "Pet parent"}`,
      `Pet: ${appointment.pet?.name || "Pet"}`,
    ]
    if (!isOnline) {
      descriptionLines.push(`Location: ${CLINIC_ADDRESS}`)
    }

    const requestBody = {
      summary: `${appointment.service || "Veterinary consultation"} - ${ownerFirstName}`,
      description: descriptionLines.join("\n"),
      start: { dateTime: startDateTime.toISOString(), timeZone },
      end: { dateTime: endDateTime.toISOString(), timeZone },
      attendees,
    }

    const wantsMeetLink = appointment.type === "online"

    if (wantsMeetLink) {
      requestBody.conferenceData = {
        createRequest: {
          requestId: `paws-care-${appointment._id || Date.now()}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      }
    }

    let response
    let meetLinkUnavailable = false

    try {
      response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
        // Google would otherwise email attendees its own native calendar
        // invite from the connected admin account (varunvaibhav06@gmail.com)
        // — all appointment email should come from noreply@ via our own
        // mailer instead, so attendee notifications are suppressed here.
        sendUpdates: "none",
        conferenceDataVersion: wantsMeetLink ? 1 : 0,
        requestBody,
      })
    } catch (error) {
      // Extremely unlikely now that we authenticate as a real connected
      // Google account rather than a bare service account, but degrade
      // gracefully rather than losing calendar sync entirely.
      if (wantsMeetLink && /conference/i.test(error.message)) {
        meetLinkUnavailable = true
        delete requestBody.conferenceData
        response = await calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
          // Google would otherwise email attendees its own native calendar
        // invite from the connected admin account (varunvaibhav06@gmail.com)
        // — all appointment email should come from noreply@ via our own
        // mailer instead, so attendee notifications are suppressed here.
        sendUpdates: "none",
          requestBody,
        })
      } else {
        throw error
      }
    }

    const meetLink =
      response.data.hangoutLink ||
      response.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ||
      null

    return {
      configured: true,
      eventId: response.data.id || null,
      meetLink,
      message: meetLinkUnavailable
        ? "Calendar event created, but a Google Meet link could not be generated automatically. Share a meeting link with the owner manually."
        : "Google Calendar event created successfully.",
    }
  } catch (error) {
    console.error("Google Calendar sync failed:", error.message)
    return {
      configured: true,
      eventId: null,
      meetLink: null,
      message: `Google Calendar sync failed: ${error.message}`,
    }
  }
}
