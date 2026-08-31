import express from "express"
import {
  addDoctorLeave,
  addMyLeave,
  checkAvailability,
  getAllLeaves,
  getMyLeaves,
  removeDoctorLeave,
  removeMyLeave,
} from "../controllers/leaveController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/availability", protect, requireRole("owner", "admin"), checkAvailability)

router.get("/mine", protect, requireRole("doctor"), getMyLeaves)
router.post("/mine", protect, requireRole("doctor"), addMyLeave)
router.delete("/mine/:date", protect, requireRole("doctor"), removeMyLeave)

router.get("/", protect, requireRole("admin"), getAllLeaves)
router.post("/", protect, requireRole("admin"), addDoctorLeave)
router.delete("/:id", protect, requireRole("admin"), removeDoctorLeave)

export default router
