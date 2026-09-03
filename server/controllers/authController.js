import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { google } from "googleapis"
import {
  createProfile,
  findProfileByEmail,
  findProfileByResetTokenHash,
  resetPasswordAndClearToken,
  setResetToken,
} from "../db/profiles.js"
import { sendPasswordResetEmail } from "../lib/mailer.js"

// A separate OAuth client from the admin's Calendar-connect flow (which
// uses GOOGLE_OAUTH_CLIENT_ID + a client secret for a server-side redirect
// exchange). This one only ever verifies ID tokens handed to it by the
// frontend's "Sign in with Google" button, so it needs its own client ID
// (registered with the frontend's origins) and no secret at all.
const googleIdTokenClient = new google.auth.OAuth2(process.env.GOOGLE_SIGNIN_CLIENT_ID)

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30 // 30 minutes
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex")

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  )
}

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
})

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      })
    }

    const trimmedEmail = String(email).trim().toLowerCase()
    const trimmedName = String(name).trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      })
    }

    const existingUser = await findProfileByEmail(trimmedEmail)

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await createProfile({
      email: trimmedEmail,
      passwordHash,
      fullName: trimmedName,
      phone: phone || "",
      role: "owner",
    })

    const token = createToken(user)

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Register error:", error)

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await findProfileByEmail(normalizedEmail)

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      })
    }

    const token = createToken(user)

    return res.json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Login error:", error)

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    })
  }
}

export const getCurrentUser = async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
  })
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Please enter your email address." })
    }

    const trimmedEmail = String(email).trim().toLowerCase()
    const user = await findProfileByEmail(trimmedEmail)

    // Always respond the same way whether or not the account exists, so the
    // endpoint can't be used to enumerate registered emails.
    const genericResponse = {
      message: "If an account exists for that email, a reset link has been sent.",
    }

    if (!user) {
      return res.json(genericResponse)
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await setResetToken(user.id, tokenHash, expiresAt)

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`

    try {
      await sendPasswordResetEmail(trimmedEmail, resetUrl)
    } catch (mailError) {
      // Dev fallback: our Resend sender is sandboxed (can only deliver to
      // the account's own signup address until a domain is verified), so
      // delivery to any other address fails here. Rather than blocking
      // password reset entirely, log the link so testing isn't stuck.
      // Verify a domain in Resend and this branch stops firing.
      console.warn(`Password reset email failed to send to ${trimmedEmail}: ${mailError.message}`)
      console.warn(`Reset link (dev fallback): ${resetUrl}`)
    }

    return res.json(genericResponse)
  } catch (error) {
    console.error("Forgot password error:", error)
    return res.status(500).json({ message: "Something went wrong. Please try again." })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." })
    }

    const tokenHash = hashToken(token)
    const user = await findProfileByResetTokenHash(tokenHash)

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await resetPasswordAndClearToken(user.id, passwordHash)

    return res.json({ message: "Your password has been reset. You can now log in." })
  } catch (error) {
    console.error("Reset password error:", error)
    return res.status(500).json({ message: "Something went wrong. Please try again." })
  }
}

export const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential." })
    }

    if (!process.env.GOOGLE_SIGNIN_CLIENT_ID) {
      return res.status(503).json({ message: "Google sign-in isn't configured yet." })
    }

    let payload
    try {
      const ticket = await googleIdTokenClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_SIGNIN_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch {
      return res.status(401).json({ message: "Invalid Google sign-in. Please try again." })
    }

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: "Your Google account's email must be verified to sign in." })
    }

    const email = payload.email.toLowerCase()
    let user = await findProfileByEmail(email)

    if (!user) {
      // Google-only accounts still need a password_hash to satisfy the
      // column's NOT NULL constraint — this random value is never used
      // since the owner always authenticates via Google.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12)
      user = await createProfile({
        email,
        passwordHash,
        fullName: payload.name || email.split("@")[0],
        phone: "",
        role: "owner",
      })
    }

    const token = createToken(user)

    return res.json({
      message: "Signed in with Google.",
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Google sign-in error:", error)
    return res.status(500).json({ message: "Something went wrong. Please try again." })
  }
}

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  googleSignIn,
}
