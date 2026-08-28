import { google } from "googleapis"
import { getConnection, updateAccessToken } from "../db/googleAuth.js"

const parseTimeString = (timeValue, baseDate) => {
  if (!timeValue || typeof timeValue !== "string") {
    return null
  }

  const normalized = timeValue.trim()

  // Postgres `time` columns are always returned as 24-hour "HH:MM" or
  // "HH:MM:SS" (e.g. "15:15:00"), never with an AM/PM suffix.
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (twentyFourHour) {
    const hours = Number(twentyFourHour[1])
    const minutes = Number(twentyFourHour[2])
    if (hours > 23 || minutes > 59) return null
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  // Fall back to accepting a 12-hour "10:30 AM" string, in case a caller
  // ever passes one directly.
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!twelveHour) {
    return null
  }

  let hours = Number(twelveHour[1])
  const minutes = Number(twelveHour[2])
  const meridiem = twelveHour[3].toUpperCase()

  if (hours === 12) {
    hours = meridiem === "AM" ? 0 : 12
  } else if (meridiem === "PM") {
    hours += 12
  }

  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
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

export async function createGoogleCalendarEventForAppointment(appointment) {
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

    const attendees = []
    if (appointment.owner?.email) attendees.push({ email: appointment.owner.email })
    if (appointment.doctor?.email) attendees.push({ email: appointment.doctor.email })

    const requestBody = {
      summary: `${appointment.service || "Veterinary consultation"} - ${appointment.pet?.name || "Pet"}`,
      description: [
        `Paws & Care veterinary clinic appointment`,
        `Service: ${appointment.service || "Consultation"}`,
        `Type: ${appointment.type || "clinic"}`,
        `Doctor: ${appointment.doctor?.name || "Veterinarian"}`,
        `Owner: ${appointment.owner?.name || "Pet parent"}`,
        `Pet: ${appointment.pet?.name || "Pet"}`,
      ].join("\n"),
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
        sendUpdates: "all",
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
          sendUpdates: "all",
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
