import { findDoctorByProfileId, findDoctorById } from "../db/doctors.js"
import {
  addLeave,
  isDoctorOnLeave,
  listAllUpcomingLeaves,
  listLeavesForDoctor,
  removeLeaveByDate,
  removeLeaveById,
} from "../db/doctorLeaves.js"

const isValidDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)

// Doctor self-service: mark/unmark their own upcoming days off.
export const getMyLeaves = async (req, res) => {
  const doctor = await findDoctorByProfileId(req.user.id)
  if (!doctor) return res.status(403).json({ message: "Doctor access is not available for this account." })

  const leaves = await listLeavesForDoctor(doctor.id)
  return res.json({ leaves })
}

export const addMyLeave = async (req, res) => {
  const doctor = await findDoctorByProfileId(req.user.id)
  if (!doctor) return res.status(403).json({ message: "Doctor access is not available for this account." })

  const { date, reason } = req.body
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." })
  }

  const leave = await addLeave(doctor.id, date, reason)
  return res.status(201).json({ message: "Day marked as leave.", leave })
}

export const removeMyLeave = async (req, res) => {
  const doctor = await findDoctorByProfileId(req.user.id)
  if (!doctor) return res.status(403).json({ message: "Doctor access is not available for this account." })

  const { date } = req.params
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." })
  }

  await removeLeaveByDate(doctor.id, date)
  return res.json({ message: "Leave removed." })
}

// Admin: manage leave for any doctor.
export const getAllLeaves = async (req, res) => {
  const leaves = await listAllUpcomingLeaves()
  return res.json({ leaves })
}

export const addDoctorLeave = async (req, res) => {
  const { doctorId, date, reason } = req.body
  if (!doctorId || !isValidDate(date)) {
    return res.status(400).json({ message: "doctorId and a valid date (YYYY-MM-DD) are required." })
  }

  const doctor = await findDoctorById(doctorId)
  if (!doctor) return res.status(404).json({ message: "Doctor not found." })

  const leave = await addLeave(doctorId, date, reason)
  return res.status(201).json({ message: "Day marked as leave.", leave })
}

export const removeDoctorLeave = async (req, res) => {
  const { id } = req.params
  await removeLeaveById(id)
  return res.json({ message: "Leave removed." })
}

// Used by the booking flow to know whether a doctor is bookable that day.
export const checkAvailability = async (req, res) => {
  const { doctorId, date } = req.query
  if (!doctorId || !isValidDate(date)) {
    return res.status(400).json({ message: "doctorId and a valid date (YYYY-MM-DD) are required." })
  }

  const onLeave = await isDoctorOnLeave(doctorId, date)
  return res.json({ onLeave })
}
