import { listDoctors, findDoctorByProfileId } from "../db/doctors.js"
import {
  findAppointmentById,
  listAppointmentsByDoctor,
  listAppointmentsByOwner,
  listBookedTimesForDoctorDate,
  updateAppointmentStatus as applyStatusUpdate,
} from "../db/appointments.js"
import { listRecordsByPet } from "../db/medicalRecords.js"
import { isDoctorOnLeave } from "../db/doctorLeaves.js"
import { BookingError, bookAppointmentForOwner } from "../services/bookingService.js"

// Postgres returns `time` columns as 24-hour strings ("09:00:00"); the
// booking UI works in 12-hour labels ("09:00 AM") so slots can be matched
// and disabled by simple string equality.
const formatTimeLabel = (time) => {
  const [hourStr, minuteStr] = time.split(":")
  let hour = parseInt(hourStr, 10)
  const suffix = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  return `${String(hour).padStart(2, "0")}:${minuteStr} ${suffix}`
}

export const getBookableDoctors = async (req, res) => {
  const doctors = await listDoctors()
  return res.json({ doctors })
}

export const getBookedSlots = async (req, res) => {
  const { doctorId, date } = req.query
  if (!doctorId || !date) {
    return res.status(400).json({ message: "doctorId and date are required." })
  }

  const [times, onLeave] = await Promise.all([
    listBookedTimesForDoctorDate(doctorId, date),
    isDoctorOnLeave(doctorId, date),
  ])
  return res.json({ bookedTimes: times.map(formatTimeLabel), onLeave })
}

export const getOwnerAppointments = async (req, res) => {
  const appointments = await listAppointmentsByOwner(req.user.id)
  return res.json({ appointments })
}

export const getDoctorAppointments = async (req, res) => {
  const doctor = await findDoctorByProfileId(req.user.id)
  if (!doctor) return res.status(403).json({ message: "Doctor access is not available for this account." })
  const appointments = await listAppointmentsByDoctor(doctor.id)
  return res.json({ appointments })
}

export const getAppointmentById = async (req, res) => {
  const appointment = await findAppointmentById(req.params.id)
  if (!appointment) return res.status(404).json({ message: "Appointment not found." })

  const isOwner = appointment.owner_id === req.user.id
  const isDoctor = appointment.doctor.profile_id === req.user.id
  const isAdmin = req.user.role === "admin"

  if (!isOwner && !isDoctor && !isAdmin) {
    return res.status(403).json({ message: "Access denied." })
  }

  const medicalRecords = await listRecordsByPet(appointment.pet_id)
  return res.json({ appointment, medicalRecords })
}

// Kept for direct/manual booking (e.g. admin tooling) — the owner-facing
// booking flow now reserves the slot only after payment succeeds, via the
// same bookAppointmentForOwner() called from paymentController.verifyPayment.
export const createOwnerAppointment = async (req, res) => {
  try {
    const { appointment, googleCalendarStatus } = await bookAppointmentForOwner(req.user.id, req.body)
    return res.status(201).json({
      message: "Appointment booked successfully.",
      googleCalendarStatus: googleCalendarStatus.message,
      appointment,
    })
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.status).json({ message: error.message })
    }
    throw error
  }
}

export const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body
  const validStatuses = ["pending", "confirmed", "completed", "cancelled"]

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "A valid appointment status is required." })
  }

  const appointment = await findAppointmentById(req.params.id)
  if (!appointment) return res.status(404).json({ message: "Appointment not found." })

  const isOwner = appointment.owner_id === req.user.id
  const isAdmin = req.user.role === "admin"
  const isDoctor = appointment.doctor.profile_id === req.user.id

  if (!isOwner && !isAdmin && !(isDoctor && status === "completed")) {
    return res.status(403).json({ message: "Access denied." })
  }

  const updated = await applyStatusUpdate(req.params.id, status)
  return res.json({ message: "Appointment status updated.", appointment: updated })
}

export const cancelOwnerAppointment = async (req, res) => {
  const appointment = await findAppointmentById(req.params.id)
  if (!appointment || appointment.owner_id !== req.user.id) {
    return res.status(404).json({ message: "Appointment not found or you are not authorized to cancel it." })
  }

  if (appointment.status === "completed") {
    return res.status(400).json({ message: "A completed appointment cannot be cancelled." })
  }

  const updated = await applyStatusUpdate(req.params.id, "cancelled")
  return res.json({ message: "Appointment cancelled successfully.", appointment: updated })
}

export const completeDoctorAppointment = async (req, res) => {
  const appointment = await findAppointmentById(req.params.id)
  const doctor = await findDoctorByProfileId(req.user.id)

  if (!appointment || !doctor || appointment.doctor_id !== doctor.id) {
    return res.status(404).json({ message: "Appointment not found or you are not authorized to update it." })
  }
  if (appointment.status === "cancelled") {
    return res.status(400).json({ message: "A cancelled appointment cannot be completed." })
  }

  const updated = await applyStatusUpdate(req.params.id, "completed")
  return res.json({ message: "Appointment completed.", appointment: updated })
}
