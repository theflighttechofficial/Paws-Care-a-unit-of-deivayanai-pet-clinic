import { countProfilesByRole } from "../db/profiles.js"
import { countPets, deletePetAsAdmin, listAllPetsWithOwners } from "../db/pets.js"
import {
  countAppointments,
  countAppointmentsByStatus,
  countAppointmentsToday,
  deleteAppointmentById,
  listAllAppointments,
} from "../db/appointments.js"
import { sendCustomEmail } from "../lib/mailer.js"

const isValidEmail = (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const getAdminStats = async (req, res) => {
  try {
    const [totalOwners, totalDoctors, totalPets, totalAppointments, todayAppointments, completedAppointments] = await Promise.all([
      countProfilesByRole("owner"),
      countProfilesByRole("doctor"),
      countPets(),
      countAppointments(),
      countAppointmentsToday(),
      countAppointmentsByStatus("completed"),
    ])

    return res.json({
      success: true,
      stats: {
        totalOwners,
        totalDoctors,
        totalPets,
        totalAppointments,
        todayAppointments,
        completedAppointments,
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return res.status(500).json({ message: "Unable to load clinic statistics." })
  }
}

export const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await listAllAppointments()
    return res.json({ success: true, appointments })
  } catch (error) {
    console.error("Admin appointments error:", error)
    return res.status(500).json({ message: "Unable to load appointments." })
  }
}

export const getAdminPatients = async (req, res) => {
  try {
    const pets = await listAllPetsWithOwners()
    return res.json({ success: true, pets })
  } catch (error) {
    console.error("Admin patients error:", error)
    return res.status(500).json({ message: "Unable to load patients." })
  }
}

export const deleteAdminAppointment = async (req, res) => {
  try {
    const deleted = await deleteAppointmentById(req.params.id)
    if (!deleted) return res.status(404).json({ message: "Appointment not found." })
    return res.json({ message: "Appointment deleted." })
  } catch (error) {
    console.error("Admin delete appointment error:", error)
    return res.status(500).json({ message: "Unable to delete appointment." })
  }
}

export const deleteAdminPatient = async (req, res) => {
  try {
    const deleted = await deletePetAsAdmin(req.params.id)
    if (!deleted) return res.status(404).json({ message: "Patient not found." })
    return res.json({ message: "Patient deleted." })
  } catch (error) {
    // pets.id is referenced by appointments.pet_id with ON DELETE RESTRICT
    // (medical_records.pet_id cascades, but appointment history shouldn't
    // silently vanish) — surface that as a clear message instead of a 500.
    if (error.code === "23503") {
      return res.status(409).json({
        message: "This patient has appointment history and can't be deleted. Cancel or remove their appointments first.",
      })
    }
    console.error("Admin delete patient error:", error)
    return res.status(500).json({ message: "Unable to delete patient." })
  }
}

export const sendAdminEmail = async (req, res) => {
  const { to, subject, message } = req.body

  if (!isValidEmail(to)) {
    return res.status(400).json({ message: "A valid recipient email is required." })
  }
  if (!String(subject || "").trim()) {
    return res.status(400).json({ message: "A subject is required." })
  }
  if (!String(message || "").trim()) {
    return res.status(400).json({ message: "A message is required." })
  }

  try {
    await sendCustomEmail({ to, subject: subject.trim(), message, replyTo: req.user.email })
    return res.json({ message: "Email sent." })
  } catch (error) {
    console.error("Admin send email error:", error)
    return res.status(500).json({ message: error.message || "Unable to send the email." })
  }
}

export default {
  getAdminStats,
  getAdminAppointments,
  getAdminPatients,
  deleteAdminAppointment,
  deleteAdminPatient,
  sendAdminEmail,
}
