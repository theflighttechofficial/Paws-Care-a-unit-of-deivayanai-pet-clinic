import { clearToken, getToken, setToken } from "./authToken"

const API_BASE = import.meta.env.VITE_API_URL || "/api"

const normalizePet = (pet) => ({
  ...pet,
  _id: pet.id,
  id: pet.id,
  name: pet.name || "",
  breed: pet.breed || "",
  species: pet.species || "Other",
  gender: pet.gender || "Unknown",
  dateOfBirth: pet.date_of_birth || pet.dateOfBirth || "",
  weight: pet.weight ?? null,
  microchipId: pet.microchip_id || pet.microchipId || "",
  profileImage: pet.profile_image || pet.profileImage || "",
  notes: pet.notes || "",
  ownerId: pet.owner_id || pet.ownerId || null,
})

const normalizeDoctor = (doctor, profile) => {
  const safeProfile = profile || {}
  const name = doctor?.name || safeProfile.full_name || "Dr. Unknown"
  const initials = doctor?.initials || name.split(" ").filter((part) => !part.startsWith("Dr.")).map((part) => part[0]).join("") || "DR"

  return {
    ...doctor,
    _id: doctor?.id || doctor?._id || doctor?.profile_id || "",
    id: doctor?.id || doctor?._id || doctor?.profile_id || "",
    name,
    initials,
    specialty: doctor?.specialization || doctor?.specialty || "General Veterinary Care",
    experience: doctor?.experience ? `${doctor.experience} years experience` : "Veterinary physician",
    email: safeProfile.email || doctor?.email || "",
    profileId: doctor?.profile_id || safeProfile.id || "",
  }
}

const normalizeMedicalRecord = (record) => {
  const rawPrescription = Array.isArray(record.prescription)
    ? record.prescription
    : Array.isArray(record.prescriptionItems)
      ? record.prescriptionItems
      : []

  const prescriptionText = rawPrescription
    .map((item) => {
      if (typeof item === "string") return item
      return [item.medication, item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")
    })
    .join("; ")

  return {
    ...record,
    _id: record.id,
    id: record.id,
    appointment: record.appointment_id || record.appointment || null,
    pet: record.pet_id || record.pet || null,
    doctor: record.doctor_name || record.doctor || null,
    symptoms: record.symptoms || "",
    notes: record.clinical_notes || record.notes || "",
    diagnosis: record.diagnosis || "",
    treatment: record.treatment || "",
    vitals: record.vitals || {},
    prescription: prescriptionText,
    prescriptionItems: rawPrescription,
    createdAt: record.created_at || record.createdAt || new Date().toISOString(),
  }
}

const normalizeAppointment = (appointment) => {
  const pet = appointment.pet || {}
  const owner = appointment.owner || {}
  const doctor = appointment.doctor || {}
  const doctorProfile = appointment.doctor_profile || doctor.profile || {}

  return {
    ...appointment,
    _id: appointment.id,
    id: appointment.id,
    service: appointment.service,
    type: appointment.consultation_type || appointment.type || "clinic",
    status: appointment.status || "pending",
    date: appointment.appointment_date || appointment.date,
    startTime: appointment.appointment_time || appointment.startTime,
    endTime: appointment.appointment_time || appointment.endTime,
    duration: appointment.duration || 30,
    notes: appointment.notes || "",
    googleMeetLink: appointment.google_meet_url || appointment.googleMeetLink || null,
    googleEventId: appointment.google_calendar_event_id || appointment.googleEventId || null,
    googleSyncStatus: appointment.google_sync_status || appointment.googleSyncStatus || null,
    paymentStatus: appointment.payment_status || appointment.paymentStatus || null,
    pet: {
      ...pet,
      _id: pet.id || pet._id || "",
      id: pet.id || pet._id || "",
      name: pet.name || "Pet",
      species: pet.species || "Other",
      breed: pet.breed || "",
      gender: pet.gender || "Unknown",
      dateOfBirth: pet.date_of_birth || pet.dateOfBirth || "",
      weight: pet.weight ?? null,
    },
    owner: {
      ...owner,
      _id: owner.id || owner._id || "",
      id: owner.id || owner._id || "",
      name: owner.full_name || owner.name || "Owner",
      email: owner.email || "",
      phone: owner.phone || "",
    },
    doctor: {
      ...doctor,
      ...doctorProfile,
      _id: doctor.id || doctor._id || doctor.profile_id || "",
      id: doctor.id || doctor._id || doctor.profile_id || "",
      name: doctor.name || doctorProfile.full_name || "Doctor",
      specialty: doctor.specialization || doctor.specialty || "General Veterinary Care",
      experience: doctor.experience ? `${doctor.experience} years experience` : "Veterinary physician",
    },
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken()

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // Empty or non-JSON body (e.g. a 204) — leave data as null.
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.")
  }

  return data || {}
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase()

  if (path === "/auth/login") {
    const data = await request("/auth/login", { method: "POST", body: options.body })
    setToken(data.token)
    return data
  }

  if (path === "/auth/register") {
    const data = await request("/auth/register", { method: "POST", body: options.body })
    setToken(data.token)
    return data
  }

  if (path === "/auth/me") {
    return request("/auth/me")
  }

  if (path === "/auth/forgot-password") {
    return request("/auth/forgot-password", { method: "POST", body: options.body })
  }

  if (path === "/auth/reset-password") {
    return request("/auth/reset-password", { method: "POST", body: options.body })
  }

  if (path === "/pets" && method === "GET") {
    const data = await request("/pets")
    return { pets: (data.pets || []).map(normalizePet) }
  }

  if (path === "/pets" && method === "POST") {
    const data = await request("/pets", { method: "POST", body: options.body })
    return { message: data.message, pet: normalizePet(data.pet) }
  }

  if (path.startsWith("/pets/") && method === "GET") {
    const data = await request(path)
    return {
      pet: normalizePet(data.pet),
      appointments: (data.appointments || []).map(normalizeAppointment),
      medicalRecords: (data.medicalRecords || []).map(normalizeMedicalRecord),
    }
  }

  if (path.startsWith("/pets/") && method === "PUT") {
    const data = await request(path, { method: "PUT", body: options.body })
    return { message: data.message, pet: normalizePet(data.pet) }
  }

  if (path.startsWith("/pets/") && method === "DELETE") {
    return request(path, { method: "DELETE" })
  }

  if (path === "/appointments/doctors") {
    const data = await request("/appointments/doctors")
    return { doctors: (data.doctors || []).map((doctor) => normalizeDoctor(doctor, doctor.profile)) }
  }

  if (path.startsWith("/appointments/booked-slots")) {
    const data = await request(path)
    return { bookedTimes: data.bookedTimes || [], onLeave: Boolean(data.onLeave) }
  }

  if (path === "/leaves/mine" && method === "GET") {
    const data = await request("/leaves/mine")
    return { leaves: data.leaves || [] }
  }

  if (path === "/leaves/mine" && method === "POST") {
    return request("/leaves/mine", { method: "POST", body: options.body })
  }

  if (path.startsWith("/leaves/mine/") && method === "DELETE") {
    return request(path, { method: "DELETE" })
  }

  if (path === "/leaves" && method === "GET") {
    const data = await request("/leaves")
    return { leaves: data.leaves || [] }
  }

  if (path === "/leaves" && method === "POST") {
    return request("/leaves", { method: "POST", body: options.body })
  }

  if (path.startsWith("/leaves/") && method === "DELETE") {
    return request(path, { method: "DELETE" })
  }

  if (path === "/payments/create-order") {
    return request("/payments/create-order", { method: "POST", body: options.body })
  }

  if (path === "/payments/verify") {
    return request("/payments/verify", { method: "POST", body: options.body })
  }

  if (path === "/appointments/owner/mine") {
    const data = await request("/appointments/owner/mine")
    return { appointments: (data.appointments || []).map(normalizeAppointment) }
  }

  if (path === "/appointments/doctor/mine") {
    const data = await request("/appointments/doctor/mine")
    return { appointments: (data.appointments || []).map(normalizeAppointment) }
  }

  if (path === "/appointments" && method === "POST") {
    const data = await request("/appointments", { method: "POST", body: options.body })
    return {
      message: data.message,
      appointment: normalizeAppointment(data.appointment),
      googleCalendarStatus: data.googleCalendarStatus,
    }
  }

  if (path.startsWith("/appointments/") && path.includes("/status") && method === "PATCH") {
    const data = await request(path, { method: "PATCH", body: options.body })
    return { message: data.message, appointment: normalizeAppointment(data.appointment) }
  }

  if (path.startsWith("/appointments/") && path.includes("/cancel") && method === "PATCH") {
    const data = await request(path, { method: "PATCH" })
    return { message: data.message, appointment: normalizeAppointment(data.appointment) }
  }

  if (path.startsWith("/appointments/") && path.includes("/complete") && method === "PATCH") {
    const data = await request(path, { method: "PATCH" })
    return { message: data.message, appointment: normalizeAppointment(data.appointment) }
  }

  if (path.startsWith("/appointments/") && !path.includes("/status") && !path.includes("/cancel") && !path.includes("/complete") && method === "GET") {
    const data = await request(path)
    return {
      appointment: normalizeAppointment(data.appointment),
      medicalRecords: (data.medicalRecords || []).map(normalizeMedicalRecord),
    }
  }

  if (path === "/medical-records" && method === "POST") {
    const data = await request("/medical-records", { method: "POST", body: options.body })
    return { message: data.message, medicalRecord: normalizeMedicalRecord(data.medicalRecord) }
  }

  if (path === "/admin/stats") {
    return request("/admin/stats")
  }

  if (path === "/admin/appointments") {
    const data = await request("/admin/appointments")
    return { success: true, appointments: (data.appointments || []).map(normalizeAppointment) }
  }

  if (path === "/admin/patients") {
    const data = await request("/admin/patients")
    return { success: true, pets: (data.pets || []).map(normalizePet) }
  }

  if (path === "/admin/google/connect") {
    return request("/admin/google/connect")
  }

  if (path === "/admin/google/status") {
    return request("/admin/google/status")
  }

  if (path === "/admin/google/disconnect" && method === "POST") {
    return request("/admin/google/disconnect", { method: "POST" })
  }

  throw new Error(`Unsupported API route: ${path}`)
}

export const logoutClient = () => clearToken()

export default apiRequest
