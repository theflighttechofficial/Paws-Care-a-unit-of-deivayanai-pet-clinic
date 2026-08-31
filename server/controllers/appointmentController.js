import { listDoctors, findDoctorById, findDoctorByProfileId } from "../db/doctors.js"
import { findPetByIdForOwner } from "../db/pets.js"
import {
  createAppointment as insertAppointment,
  findAppointmentById,
  findConflictingSlot,
  listAppointmentsByDoctor,
  listAppointmentsByOwner,
  listBookedTimesForDoctorDate,
  setGoogleCalendarInfo,
  updateAppointmentStatus as applyStatusUpdate,
} from "../db/appointments.js"
import { listRecordsByPet } from "../db/medicalRecords.js"
import { isDoctorOnLeave } from "../db/doctorLeaves.js"
import { createGoogleCalendarEventForAppointment, getGoogleCalendarStatus } from "../lib/googleCalendar.js"

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

export const createOwnerAppointment = async (req, res) => {
  const { petId, doctorId, service, type, date, startTime } = req.body
  if (!petId || !doctorId || !service || !type || !date || !startTime) {
    return res.status(400).json({ message: "Please complete all appointment details." })
  }

  const pet = await findPetByIdForOwner(petId, req.user.id)
  if (!pet) return res.status(404).json({ message: "Pet not found." })

  const doctor = await findDoctorById(doctorId)
  if (!doctor) return res.status(400).json({ message: "Selected doctor is unavailable." })

  const appointmentDate = new Date(date).toISOString().slice(0, 10)

  const onLeave = await isDoctorOnLeave(doctorId, appointmentDate)
  if (onLeave) {
    return res.status(409).json({ message: "This doctor is on leave that day. Please choose another date." })
  }

  const conflict = await findConflictingSlot(doctorId, appointmentDate, startTime)
  if (conflict) {
    return res.status(409).json({ message: "This time slot is no longer available." })
  }

  let appointment
  try {
    appointment = await insertAppointment({
      ownerId: req.user.id,
      petId: pet.id,
      doctorId: doctor.id,
      service,
      consultationType: type,
      date: appointmentDate,
      time: startTime,
    })
  } catch (error) {
    // Belt-and-braces: the pre-check above has a race window between two
    // concurrent bookings, so the DB's partial unique index
    // (appointments_doctor_slot_unique) is the actual source of truth.
    if (error.code === "23505") {
      return res.status(409).json({ message: "This time slot is no longer available." })
    }
    throw error
  }

  let googleCalendarStatus = await getGoogleCalendarStatus()

  if (appointment.consultation_type === "online" || appointment.consultation_type === "clinic") {
    const calendarEvent = await createGoogleCalendarEventForAppointment({
      _id: appointment.id,
      service: appointment.service,
      type: appointment.consultation_type,
      date: appointment.appointment_date,
      startTime: appointment.appointment_time,
      duration: appointment.duration,
      pet: appointment.pet,
      owner: { name: appointment.owner.full_name, email: appointment.owner.email },
      doctor: { name: appointment.doctor.profile.full_name, email: appointment.doctor.profile.email },
    })
    googleCalendarStatus = calendarEvent

    if (calendarEvent.eventId || calendarEvent.meetLink) {
      appointment = await setGoogleCalendarInfo(appointment.id, {
        eventId: calendarEvent.eventId,
        meetLink: calendarEvent.meetLink,
      })
    }
  }

  return res.status(201).json({
    message: "Appointment booked successfully.",
    googleCalendarStatus: googleCalendarStatus.message,
    appointment,
  })
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
