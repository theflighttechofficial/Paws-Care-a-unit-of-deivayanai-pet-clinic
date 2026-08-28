import { countProfilesByRole } from "../db/profiles.js"
import { countPets, listAllPetsWithOwners } from "../db/pets.js"
import { countAppointments, countAppointmentsByStatus, countAppointmentsToday, listAllAppointments } from "../db/appointments.js"

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

export default {
  getAdminStats,
  getAdminAppointments,
  getAdminPatients,
}
