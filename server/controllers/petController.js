import { createPet as insertPet, deletePet as removePet, findPetByIdForOwner, listPetsByOwner, updatePet as applyPetUpdate } from "../db/pets.js"
import { listAppointmentsByOwnerAndPet } from "../db/appointments.js"
import { listRecordsByPet } from "../db/medicalRecords.js"

const validatePet = (body) => {
  if (!String(body.name || "").trim()) return "Pet name is required."
  if (!body.species) return "Species is required."
  if (body.dateOfBirth && new Date(body.dateOfBirth) > new Date()) return "Date of birth cannot be in the future."
  if (body.weight !== "" && body.weight !== undefined && (!Number.isFinite(Number(body.weight)) || Number(body.weight) <= 0)) return "Weight must be a positive number."
  if (String(body.notes || "").length > 2000) return "Notes must be 2,000 characters or fewer."
  return null
}

const petPayload = (body) => ({
  name: body.name,
  species: body.species,
  breed: body.breed,
  gender: body.gender,
  date_of_birth: body.dateOfBirth || null,
  weight: body.weight === "" || body.weight === undefined ? null : Number(body.weight),
  color: body.color,
  microchip_id: body.microchipId,
  notes: body.notes,
})

export const getPets = async (req, res) => {
  const pets = await listPetsByOwner(req.user.id)
  return res.json({ pets })
}

export const createPet = async (req, res) => {
  const validationError = validatePet(req.body)
  if (validationError) return res.status(400).json({ message: validationError })
  const pet = await insertPet(req.user.id, petPayload(req.body))
  return res.status(201).json({ message: "Pet added successfully.", pet })
}

export const getPet = async (req, res) => {
  const pet = await findPetByIdForOwner(req.params.id, req.user.id)
  if (!pet) return res.status(404).json({ message: "Pet not found." })

  const [appointments, medicalRecords] = await Promise.all([
    listAppointmentsByOwnerAndPet(req.user.id, pet.id),
    listRecordsByPet(pet.id),
  ])

  return res.json({ pet, appointments, medicalRecords })
}

export const updatePet = async (req, res) => {
  const validationError = validatePet({ ...req.body, name: req.body.name ?? "existing", species: req.body.species ?? "existing" })
  if (validationError) return res.status(400).json({ message: validationError })
  const pet = await applyPetUpdate(req.params.id, req.user.id, petPayload(req.body))
  if (!pet) return res.status(404).json({ message: "Pet not found." })
  return res.json({ message: "Pet updated successfully.", pet })
}

export const deletePet = async (req, res) => {
  try {
    const deleted = await removePet(req.params.id, req.user.id)
    if (!deleted) return res.status(404).json({ message: "Pet not found." })
    return res.json({ message: "Pet deleted successfully." })
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "This pet has appointment history and can't be deleted. Contact the clinic if you need it removed.",
      })
    }
    throw error
  }
}
