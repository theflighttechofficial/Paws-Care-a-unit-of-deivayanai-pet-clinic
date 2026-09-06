import { countProfilesByRole } from "../db/profiles.js"
import { countPets, listAllPetsWithOwners } from "../db/pets.js"
import {
  countAppointments,
  countAppointmentsByStatus,
  countAppointmentsToday,
  deleteAppointmentById,
  listAllAppointments,
} from "../db/appointments.js"

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

export default {
  getAdminStats,
  getAdminAppointments,
  getAdminPatients,
  deleteAdminAppointment,
}
