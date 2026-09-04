import { findDoctorById } from "../db/doctors.js"
import { findPetByIdForOwner } from "../db/pets.js"
import {
  createAppointment as insertAppointment,
  findConflictingSlot,
  setGoogleCalendarInfo,
} from "../db/appointments.js"
import { isDoctorOnLeave } from "../db/doctorLeaves.js"
import { sendDoctorNewAppointmentEmail, sendOwnerBookingConfirmationEmail } from "../lib/mailer.js"
import { createGoogleCalendarEventForAppointment, getGoogleCalendarStatus, parseTimeString } from "../lib/googleCalendar.js"

export class BookingError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Shared by the (now unused-by-the-booking-flow, but still-public)
// POST /appointments endpoint and the post-payment booking step in
// paymentController.verifyPayment — both need the exact same validation so
// a slot that fails one path can't succeed on the other.
export const validateBookingDetails = async (ownerId, { petId, doctorId, service, type, date, startTime }) => {
  if (!petId || !doctorId || !service || !type || !date || !startTime) {
    throw new BookingError(400, "Please complete all appointment details.")
  }

  const pet = await findPetByIdForOwner(petId, ownerId)
  if (!pet) throw new BookingError(404, "Pet not found.")

  const doctor = await findDoctorById(doctorId)
  if (!doctor) throw new BookingError(400, "Selected doctor is unavailable.")

  const appointmentDate = new Date(date).toISOString().slice(0, 10)

  const slotDateTime = parseTimeString(startTime, appointmentDate)
  if (!slotDateTime || slotDateTime <= new Date()) {
    throw new BookingError(400, "That time has already passed. Please choose an upcoming slot.")
  }

  const onLeave = await isDoctorOnLeave(doctorId, appointmentDate)
  if (onLeave) {
    throw new BookingError(409, "This doctor is on leave that day. Please choose another date.")
  }

  const conflict = await findConflictingSlot(doctorId, appointmentDate, startTime)
  if (conflict) {
    throw new BookingError(409, "This time slot is no longer available.")
  }

  return { pet, doctor, appointmentDate }
}

export const bookAppointmentForOwner = async (ownerId, details) => {
  const { pet, doctor, appointmentDate } = await validateBookingDetails(ownerId, details)
  const { service, type, startTime } = details

  let appointment
  try {
    appointment = await insertAppointment({
      ownerId,
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
      throw new BookingError(409, "This time slot is no longer available.")
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

    const syncStatus = calendarEvent.eventId
      ? "success"
      : calendarEvent.configured === false
        ? "not_configured"
        : "failed"

    appointment = await setGoogleCalendarInfo(appointment.id, {
      eventId: calendarEvent.eventId,
      meetLink: calendarEvent.meetLink,
      syncStatus,
    })
  }

  if (appointment.doctor?.profile?.email) {
    try {
      await sendDoctorNewAppointmentEmail(appointment.doctor.profile.email, {
        pet_name: appointment.pet?.name,
        owner_name: appointment.owner?.full_name,
        service: appointment.service,
        consultation_type: appointment.consultation_type,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
      })
    } catch (error) {
      console.warn(`Doctor notification email failed to send to ${appointment.doctor.profile.email}: ${error.message}`)
    }
  }

  if (appointment.owner?.email) {
    try {
      await sendOwnerBookingConfirmationEmail(appointment.owner.email, {
        pet_name: appointment.pet?.name,
        doctor_name: appointment.doctor?.profile?.full_name,
        doctor_email: appointment.doctor?.profile?.email,
        service: appointment.service,
        consultation_type: appointment.consultation_type,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        meet_link: appointment.google_meet_url,
      })
    } catch (error) {
      console.warn(`Booking confirmation email failed to send to ${appointment.owner.email}: ${error.message}`)
    }
  }

  return { appointment, googleCalendarStatus }
}
