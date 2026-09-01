import { createService, deleteService, listServices, updateService } from "../db/services.js"

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const validateService = (body) => {
  if (!String(body.title || "").trim()) return "Service title is required."
  if (!body.phoneOnly) {
    if (body.price !== "" && body.price !== undefined && body.price !== null && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) {
      return "Price must be a positive number."
    }
    if (body.duration !== "" && body.duration !== undefined && body.duration !== null && (!Number.isFinite(Number(body.duration)) || Number(body.duration) <= 0)) {
      return "Duration must be a positive number of minutes."
    }
  }
  return null
}

const shapeService = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description || "",
  duration: row.duration_minutes,
  price: row.price_inr,
  icon: row.icon,
  phoneOnly: row.phone_only,
  sortOrder: row.sort_order,
})

export const getServices = async (req, res) => {
  try {
    const services = await listServices()
    return res.json({ success: true, services: services.map(shapeService) })
  } catch (error) {
    console.error("List services error:", error)
    return res.status(500).json({ message: "Unable to load services." })
  }
}

export const postService = async (req, res) => {
  const validationError = validateService(req.body)
  if (validationError) return res.status(400).json({ message: validationError })

  try {
    const service = await createService({
      slug: `${slugify(req.body.title)}-${Date.now().toString(36)}`,
      title: req.body.title,
      description: req.body.description,
      duration_minutes: req.body.duration === "" ? null : req.body.duration,
      price_inr: req.body.price === "" ? null : req.body.price,
      icon: req.body.icon,
      phone_only: Boolean(req.body.phoneOnly),
      sort_order: req.body.sortOrder ?? 0,
    })
    return res.status(201).json({ message: "Service added.", service: shapeService(service) })
  } catch (error) {
    console.error("Create service error:", error)
    return res.status(500).json({ message: "Unable to add service." })
  }
}

export const putService = async (req, res) => {
  const validationError = validateService({ ...req.body, title: req.body.title ?? "existing" })
  if (validationError) return res.status(400).json({ message: validationError })

  try {
    const service = await updateService(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      duration_minutes: req.body.duration === "" ? null : req.body.duration,
      price_inr: req.body.price === "" ? null : req.body.price,
      icon: req.body.icon,
      phone_only: Boolean(req.body.phoneOnly),
      sort_order: req.body.sortOrder,
    })
    if (!service) return res.status(404).json({ message: "Service not found." })
    return res.json({ message: "Service updated.", service: shapeService(service) })
  } catch (error) {
    console.error("Update service error:", error)
    return res.status(500).json({ message: "Unable to update service." })
  }
}

export const removeService = async (req, res) => {
  try {
    const deleted = await deleteService(req.params.id)
    if (!deleted) return res.status(404).json({ message: "Service not found." })
    return res.json({ message: "Service removed." })
  } catch (error) {
    console.error("Delete service error:", error)
    return res.status(500).json({ message: "Unable to remove service." })
  }
}
