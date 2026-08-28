import express from "express"
import { createPet, deletePet, getPet, getPets, updatePet } from "../controllers/petController.js"
import { protect, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()
router.use(protect, requireRole("owner"))
router.route("/").get(getPets).post(createPet)
router.route("/:id").get(getPet).put(updatePet).delete(deletePet)
export default router
