import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, X } from "lucide-react"
import apiRequest from "../lib/api"
import ErrorNotice from "./ErrorNotice"

// General-purpose "compose and send an email" modal for admins — used from
// the Patients list (prefilled with an owner's address) but takes any
// recipient, so it doubles as a standalone "send an email" tool.
export default function SendEmailModal({ defaultTo = "", defaultToLabel = "", onClose }) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const send = async (event) => {
    event.preventDefault()
    setError("")

    if (!to.trim() || !subject.trim() || !message.trim()) {
      setError("Fill in the recipient, subject, and message.")
      return
    }

    setSending(true)
    try {
      await apiRequest("/admin/send-email", {
        method: "POST",
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), message }),
      })
      setSent(true)
    } catch (err) {
      setError(err.message || "Unable to send the email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1611]/60 px-5">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-7 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#9aa59f] transition hover:bg-[#f1f4f1]"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
          <Mail size={19} />
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">Send an email</h2>
        {defaultToLabel && <p className="mt-1 text-xs text-[#87928c]">To {defaultToLabel}</p>}

        {sent ? (
          <div className="mt-6 rounded-2xl bg-[#e4f1e7] px-4 py-4 text-sm text-[#397051]">
            Email sent to {to}.
          </div>
        ) : (
          <form onSubmit={send} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#52615a]">To</span>
              <input
                type="email"
                required
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 py-3 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#52615a]">Subject</span>
              <input
                type="text"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 py-3 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#52615a]">Message</span>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full resize-none rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] px-4 py-3 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
              />
            </label>

            {error && <ErrorNotice message={error} />}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-[#173b31] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#285b4c] disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send email"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
