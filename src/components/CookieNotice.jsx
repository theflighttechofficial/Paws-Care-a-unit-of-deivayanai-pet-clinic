import { useState } from "react"
import { Link } from "react-router-dom"

const STORAGE_KEY = "pawscare_cookie_notice_ack"

const readAck = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

// The site only uses browser storage that is strictly necessary (sign-in
// session) plus third-party services (Google sign-in/maps/fonts, Razorpay
// payments). This is a transparency notice with a stored acknowledgement.
export default function CookieNotice() {
  const [dismissed, setDismissed] = useState(readAck)

  if (dismissed) return null

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // storage unavailable — just hide for this visit
    }
    setDismissed(true)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-2xl rounded-2xl border border-[#dfe6e1] bg-white p-4 text-sm text-[#52615a] shadow-2xl shadow-[#173b31]/15 sm:p-5"
    >
      <p className="leading-6">
        We use essential browser storage to keep you signed in, and load Google (sign-in, maps, fonts) and Razorpay
        (payments) when you use those features. Read our{" "}
        <Link to="/privacy" className="font-semibold text-[#285b4c] underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={acknowledge}
          className="rounded-full bg-[#173b31] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#285b4c]"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
