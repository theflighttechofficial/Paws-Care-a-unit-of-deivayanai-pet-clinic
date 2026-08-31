import express from "express"
import { createOrder, verifyPayment } from "../controllers/paymentController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/create-order", protect, requireRole("owner"), createOrder)
router.post("/verify", protect, requireRole("owner"), verifyPayment)

export default router
