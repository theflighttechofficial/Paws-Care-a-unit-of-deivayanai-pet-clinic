import { createOrUpdateRating, listAllRatings } from "../db/ratings.js"
import { findAppointmentById } from "../db/appointments.js"

export const submitRating = async (req, res) => {
  const { rating, feedback } = req.body

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be a whole number between 1 and 5." })
  }

  if (String(feedback || "").length > 1000) {
    return res.status(400).json({ message: "Feedback must be 1,000 characters or fewer." })
  }

  const appointment = await findAppointmentById(req.params.id)
  if (!appointment || appointment.owner_id !== req.user.id) {
    return res.status(404).json({ message: "Appointment not found." })
  }

  const saved = await createOrUpdateRating({
    appointmentId: req.params.id,
    ownerId: req.user.id,
    rating,
    feedback,
  })

  return res.status(201).json({ message: "Thanks for the feedback!", rating: saved })
}

export const getAdminRatings = async (req, res) => {
  try {
    const ratings = await listAllRatings()
    return res.json({ success: true, ratings })
  } catch (error) {
    console.error("List ratings error:", error)
    return res.status(500).json({ message: "Unable to load feedback." })
  }
}
