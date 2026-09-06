import express from "express"
import { deleteAdminAppointment, getAdminAppointments, getAdminPatients, getAdminStats } from "../controllers/adminController.js"
import { disconnectGoogle, getGoogleConnectionStatus, startGoogleConnect } from "../controllers/googleAuthController.js"
import { getAllPayments, recordManualPayment } from "../controllers/paymentController.js"
import { getAdminRatings } from "../controllers/ratingController.js"
import { updateBookingSchedule, updateOnlineConsultationFee, updatePhoneConsultationFee } from "../controllers/settingsController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.use(protect)
router.use(requireRole("admin"))

router.get("/stats", getAdminStats)
router.get("/appointments", getAdminAppointments)
router.delete("/appointments/:id", deleteAdminAppointment)
router.get("/patients", getAdminPatients)
router.get("/payments", getAllPayments)
router.post("/payments", recordManualPayment)
router.get("/ratings", getAdminRatings)
router.put("/settings/fee/online", updateOnlineConsultationFee)
router.put("/settings/fee/phone", updatePhoneConsultationFee)
router.put("/settings/schedule", updateBookingSchedule)
router.get("/google/connect", startGoogleConnect)
router.get("/google/status", getGoogleConnectionStatus)
router.post("/google/disconnect", disconnectGoogle)

export default router
