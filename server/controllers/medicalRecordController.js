import { findAppointmentById } from "../db/appointments.js"
import { findDoctorByProfileId } from "../db/doctors.js"
import { upsertRecordForAppointment } from "../db/medicalRecords.js"

const numericVitals = ["weight", "temperature", "heartRate", "respiratoryRate"]

const normalizeVitals = (vitals = {}) => {
  const result = {}
  for (const field of numericVitals) {
    const value = vitals[field]
    if (value === "" || value === undefined || value === null) continue
    const number = Number(value)
    if (!Number.isFinite(number) || number < 0) return null
    result[field] = number
  }
  return result
}

export const saveMedicalRecord = async (req, res) => {
  const { appointmentId, symptoms = "", notes = "", diagnosis = "", treatment = "", vitals, prescriptionItems = [] } = req.body

  if (!appointmentId) {
    return res.status(400).json({ message: "A valid appointment is required." })
  }

  const appointment = await findAppointmentById(appointmentId)
  const doctor = await findDoctorByProfileId(req.user.id)

  if (!appointment || !doctor || appointment.doctor_id !== doctor.id) {
    return res.status(404).json({ message: "Appointment not found or you are not authorized to create this record." })
  }

  const normalizedVitals = normalizeVitals(vitals)
  if (!normalizedVitals) {
    return res.status(400).json({ message: "Vitals must contain valid non-negative numbers." })
  }

  const items = Array.isArray(prescriptionItems)
    ? prescriptionItems
        .filter((item) => item && Object.values(item).some((value) => String(value || "").trim()))
        .map((item) => ({
          medication: String(item.medication || "").trim(),
          dosage: String(item.dosage || "").trim(),
          frequency: String(item.frequency || "").trim(),
          duration: String(item.duration || "").trim(),
        }))
    : []

  const medicalRecord = await upsertRecordForAppointment({
    petId: appointment.pet_id,
    doctorId: doctor.id,
    appointmentId: appointment.id,
    symptoms: String(symptoms).trim(),
    clinicalNotes: String(notes).trim(),
    diagnosis: String(diagnosis).trim(),
    treatment: String(treatment).trim(),
    prescription: items,
    vitals: normalizedVitals,
  })

  return res.status(201).json({ message: "Medical record saved.", medicalRecord })
}
