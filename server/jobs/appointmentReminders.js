import { listAppointmentsDueForReminder, markReminderSent } from "../db/appointments.js"
import { sendAppointmentReminderEmail } from "../lib/mailer.js"

// Polled on an interval from server.js (no external cron infra in this
// app) — finds appointments starting in the next 24h that haven't had a
// reminder sent, emails the owner, and marks each as sent so it's not
// re-sent on the next tick.
export const sendDueReminders = async () => {
  const due = await listAppointmentsDueForReminder()

  for (const appointment of due) {
    try {
      await sendAppointmentReminderEmail(appointment.owner_email, appointment)
    } catch (error) {
      // Dev fallback, same reasoning as the password-reset email: the
      // Resend sandbox can only deliver to the account's own signup
      // address until a domain is verified. Log instead of blocking so a
      // config gap here doesn't spin this appointment forever.
      console.warn(`Reminder email failed to send to ${appointment.owner_email}: ${error.message}`)
    }
    await markReminderSent(appointment.id)
  }

  return due.length
}
