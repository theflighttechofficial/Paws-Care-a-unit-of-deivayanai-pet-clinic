// Builds a "Add to Google Calendar" link (Google's public template-event
// URL — no API key or auth needed). This is how the CLIENT gets the
// appointment onto their own calendar: our service account can create the
// event on the clinic's calendar, but Google rejects a bare service
// account (no Domain-Wide Delegation) from inviting attendees, so there's
// no way to push the event onto the client's calendar automatically.
const CLINIC_TIMEZONE = "Asia/Kolkata"

const pad = (value) => String(value).padStart(2, "0")

const toCompactDate = (isoDateValue) => {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoDateValue))

  return day.replace(/-/g, "")
}

// appointment.startTime is a wall-clock "HH:MM(:SS)" string in the clinic's
// timezone. Treated as UTC purely so Date math (adding the duration) can
// roll over midnight correctly without any real timezone conversion.
const toCompactDateTime = (compactDate, timeStr, addMinutes = 0) => {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const year = Number(compactDate.slice(0, 4))
  const month = Number(compactDate.slice(4, 6)) - 1
  const day = Number(compactDate.slice(6, 8))

  const asUtc = new Date(Date.UTC(year, month, day, hours, minutes))
  asUtc.setUTCMinutes(asUtc.getUTCMinutes() + addMinutes)

  const y = asUtc.getUTCFullYear()
  const mo = pad(asUtc.getUTCMonth() + 1)
  const d = pad(asUtc.getUTCDate())
  const h = pad(asUtc.getUTCHours())
  const mi = pad(asUtc.getUTCMinutes())

  return `${y}${mo}${d}T${h}${mi}00`
}

export function buildGoogleCalendarLink(appointment) {
  if (!appointment?.date || !appointment?.startTime) return null

  const compactDate = toCompactDate(appointment.date)
  const start = toCompactDateTime(compactDate, appointment.startTime, 0)
  const end = toCompactDateTime(compactDate, appointment.startTime, appointment.duration || 30)

  const title = `${appointment.service || "Vet appointment"} — ${appointment.pet?.name || "Pet"}`
  const details = [
    `Paws & Care (a unit of Deivayanai Pet Clinic) veterinary appointment`,
    appointment.doctor?.name ? `Veterinarian: ${appointment.doctor.name}` : null,
    appointment.type ? `Type: ${appointment.type}` : null,
    appointment.googleMeetLink ? `Meet link: ${appointment.googleMeetLink}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    ctz: CLINIC_TIMEZONE,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
