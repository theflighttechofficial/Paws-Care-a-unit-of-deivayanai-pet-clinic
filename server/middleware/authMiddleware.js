import jwt from "jsonwebtoken"
import { findProfileById } from "../db/profiles.js"

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token missing.",
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await findProfileById(decoded.id)

    if (!user) {
      return res.status(401).json({
        message: "User not found or token invalid.",
      })
    }

    delete user.password_hash
    req.user = user
    next()
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token.",
    })
  }
}

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied.",
      })
    }

    next()
  }
}

export default protect
