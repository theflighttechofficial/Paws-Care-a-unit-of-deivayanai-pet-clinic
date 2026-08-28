const STORAGE_KEY = "pawscare_token"

let currentToken = null
try {
  currentToken = localStorage.getItem(STORAGE_KEY)
} catch {
  currentToken = null
}

export const getToken = () => currentToken

export const setToken = (token) => {
  currentToken = token
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (private browsing, etc.) — token still works in-memory for this tab.
  }
}

export const clearToken = () => setToken(null)
