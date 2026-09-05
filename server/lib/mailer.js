import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// No fallback to Resend's shared onboarding@resend.dev sandbox sender —
// that address can only deliver to the Resend account's own signup email
// and must never be used for real customer-facing mail. RESEND_FROM must
// be explicitly set to the verified domain (e.g. "Paws & Care <noreply@yourdomain.com>").
const FROM = process.env.RESEND_FROM

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!resend || !FROM) {
    throw new Error("RESEND_API_KEY and RESEND_FROM must both be configured.")
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Reset your Paws & Care password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#173b31;">Reset your password</h2>
        <p>We received a request to reset the password for your Paws & Care account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#173b31;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="color:#718079;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message || "Failed to send reset email.")
  }
}

const formatReminderDate = (date, time) => {
  const [hourStr, minuteStr] = time.split(":")
  let hour = parseInt(hourStr, 10)
  const suffix = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  const dateLabel = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  return `${dateLabel} at ${hour}:${minuteStr} ${suffix}`
}

export const sendAppointmentReminderEmail = async (toEmail, appointment) => {
  if (!resend || !FROM) {
    throw new Error("RESEND_API_KEY and RESEND_FROM must both be configured.")
  }

  const when = formatReminderDate(appointment.appointment_date, appointment.appointment_time)

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Reminder: ${appointment.pet_name}'s appointment tomorrow`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#173b31;">Upcoming appointment reminder</h2>
        <p>This is a reminder that <strong>${appointment.pet_name}</strong> has a <strong>${appointment.service}</strong> appointment coming up.</p>
        <p style="color:#173b31;font-weight:600;">${when}</p>
        <p>With ${appointment.doctor_name} · ${appointment.consultation_type} consultation</p>
        <p style="color:#718079;font-size:13px;">See you soon at Paws & Care.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message || "Failed to send reminder email.")
  }
}

export const sendDoctorNewAppointmentEmail = async (toEmail, appointment) => {
  if (!resend || !FROM) {
    throw new Error("RESEND_API_KEY and RESEND_FROM must both be configured.")
  }

  const when = formatReminderDate(appointment.appointment_date, appointment.appointment_time)

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `New appointment: ${appointment.pet_name} on ${when}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#173b31;">You have a new appointment</h2>
        <p><strong>${appointment.owner_name}</strong> booked a <strong>${appointment.service}</strong> visit for <strong>${appointment.pet_name}</strong>.</p>
        <p style="color:#173b31;font-weight:600;">${when}</p>
        <p>${appointment.consultation_type === "online" ? "Online consultation" : "In-clinic visit"}</p>
        <p style="color:#718079;font-size:13px;">This has also been added to your Google Calendar if it's connected.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message || "Failed to send doctor notification email.")
  }
}

export const sendOwnerBookingConfirmationEmail = async (toEmail, appointment) => {
  if (!resend || !FROM) {
    throw new Error("RESEND_API_KEY and RESEND_FROM must both be configured.")
  }

  const when = formatReminderDate(appointment.appointment_date, appointment.appointment_time)
  const isOnline = appointment.consultation_type === "online"

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    ...(appointment.doctor_email ? { cc: appointment.doctor_email } : {}),
    subject: `Appointment confirmed: ${appointment.pet_name} on ${when}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#173b31;">Your appointment is confirmed</h2>
        <p><strong>${appointment.pet_name}</strong>'s <strong>${appointment.service}</strong> appointment with ${appointment.doctor_name} is booked.</p>
        <p style="color:#173b31;font-weight:600;">${when}</p>
        <p>${isOnline ? "Online consultation via Google Meet" : "In-clinic visit"}</p>
        ${
          appointment.meet_link
            ? `<p>
                <a href="${appointment.meet_link}" style="display:inline-block;background:#173b31;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">
                  Join Google Meet
                </a>
              </p>`
            : isOnline
              ? `<p style="color:#718079;font-size:13px;">Your Google Meet link will be available closer to the appointment.</p>`
              : ""
        }
        <p style="color:#718079;font-size:13px;">We'll send you a reminder the day before. See you soon at Paws & Care.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message || "Failed to send booking confirmation email.")
  }
}

export default {
  sendPasswordResetEmail,
  sendAppointmentReminderEmail,
  sendDoctorNewAppointmentEmail,
  sendOwnerBookingConfirmationEmail,
}
