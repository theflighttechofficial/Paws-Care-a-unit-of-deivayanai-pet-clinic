import express from "express"
import { createOrder, getMyPayments, verifyPayment } from "../controllers/paymentController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/create-order", protect, requireRole("owner"), createOrder)
router.post("/verify", protect, requireRole("owner"), verifyPayment)
router.get("/mine", protect, requireRole("owner"), getMyPayments)

export default router
