import express from "express"
import { getServices, postService, putService, removeService } from "../controllers/serviceController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public: the booking flow needs the current service catalog before login-gated pages.
router.get("/", getServices)

router.post("/", protect, requireRole("admin"), postService)
router.route("/:id").put(protect, requireRole("admin"), putService).delete(protect, requireRole("admin"), removeService)

export default router
