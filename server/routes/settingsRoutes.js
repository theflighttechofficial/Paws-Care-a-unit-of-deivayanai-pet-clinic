import express from "express"
import { getPublicSettings } from "../controllers/settingsController.js"

const router = express.Router()

// Public: the booking flow needs the current consultation fee before
// login-gated pages, same reasoning as the public /services route.
router.get("/", getPublicSettings)

export default router
