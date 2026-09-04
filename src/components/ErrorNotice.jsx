import { Mail } from "lucide-react"
import { ADMIN_EMAIL } from "../lib/clinicInfo"

// Standard inline error banner used across forms — always pairs the
// message with a one-click "email the admin" link so a stuck user has a
// way out beyond retrying silently.
export default function ErrorNotice({ message, className = "" }) {
  if (!message) return null

  const mailHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent("Paws & Care — Error report")}&body=${encodeURIComponent(
    `I ran into an issue on Paws & Care:\n\n${message}\n\nPage: ${typeof window !== "undefined" ? window.location.href : ""}`
  )}`

  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 ${className}`}>
      <p>{message}</p>
      <a
        href={mailHref}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 underline underline-offset-2"
      >
        <Mail size={12} />
        Email admin about this
      </a>
    </div>
  )
}
