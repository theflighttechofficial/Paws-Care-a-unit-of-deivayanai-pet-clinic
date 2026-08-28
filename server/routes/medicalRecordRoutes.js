import express from "express"
import { saveMedicalRecord } from "../controllers/medicalRecordController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()
router.post("/", protect, requireRole("doctor"), saveMedicalRecord)

export default router
