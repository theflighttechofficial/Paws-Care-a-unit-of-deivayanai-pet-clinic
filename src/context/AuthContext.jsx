import { createContext, useContext, useEffect, useMemo, useState } from "react"
import apiRequest from "../lib/api"
import { clearToken, getToken } from "../lib/authToken"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const token = getToken()

      if (!token) {
        if (active) setLoading(false)
        return
      }

      try {
        const { user: restoredUser } = await apiRequest("/auth/me")
        if (active) setUser(restoredUser)
      } catch (error) {
        console.error("Session restore failed", error)
        clearToken()
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  const login = async (credentials) => {
    const { user: loggedInUser } = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    })

    setUser(loggedInUser)
    return { user: loggedInUser }
  }

  const register = async (credentials) => {
    const { user: registeredUser, message } = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        phone: credentials.phone || "",
      }),
    })

    setUser(registeredUser)
    return { user: registeredUser, message }
  }

  const logout = async () => {
    clearToken()
    setUser(null)
  }

  const isAuthenticated = () => Boolean(user && getToken())

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

export default AuthContext
