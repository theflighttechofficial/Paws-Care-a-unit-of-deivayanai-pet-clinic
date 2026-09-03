import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = "https://accounts.google.com/gsi/client"

const roleHomeMap = { owner: "/dashboard", doctor: "/doctor", admin: "/admin" }

let scriptLoadPromise = null
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error("Failed to load Google sign-in."))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

// Renders Google's own "Sign in with Google" button (via Google Identity
// Services) so we never handle credentials directly — it hands us a signed
// ID token, which the backend verifies before issuing our own JWT.
export default function GoogleSignInButton() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const buttonRef = useRef(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false

    const handleCredential = async (response) => {
      setError("")
      try {
        const { user } = await loginWithGoogle(response.credential)
        navigate(roleHomeMap[user.role] || "/dashboard")
      } catch (err) {
        setError(err.message || "Google sign-in failed. Please try again.")
      }
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          shape: "pill",
          theme: "outline",
          size: "large",
          width: 320,
        })
      })
      .catch((err) => setError(err.message))

    return () => {
      cancelled = true
    }
  }, [loginWithGoogle, navigate])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
