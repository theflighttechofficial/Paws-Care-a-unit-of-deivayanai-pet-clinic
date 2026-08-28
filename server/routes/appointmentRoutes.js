import express from "express"
import {
  cancelOwnerAppointment,
  completeDoctorAppointment,
  createOwnerAppointment,
  getAppointmentById,
  getBookableDoctors,
  getBookedSlots,
  getDoctorAppointments,
  getOwnerAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/doctors", protect, requireRole("owner", "admin"), getBookableDoctors)
router.get("/booked-slots", protect, requireRole("owner", "admin"), getBookedSlots)
router.get("/owner/mine", protect, requireRole("owner"), getOwnerAppointments)
router.post("/", protect, requireRole("owner"), createOwnerAppointment)
router.get("/doctor/mine", protect, requireRole("doctor"), getDoctorAppointments)
router.get("/:id", protect, getAppointmentById)
router.patch("/:id/status", protect, updateAppointmentStatus)
router.patch("/:id/cancel", protect, cancelOwnerAppointment)
router.patch("/:id/complete", protect, requireRole("doctor"), completeDoctorAppointment)

export default router
