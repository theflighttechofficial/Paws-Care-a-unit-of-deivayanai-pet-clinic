import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Mail } from "lucide-react"
import Logo from "../components/Logo"
import apiRequest from "../lib/api"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setResult(data)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-[#173b31]/10 sm:p-12"
        >
          <Link to="/login" className="text-sm font-semibold text-[#52615a]">
            ← Back to sign in
          </Link>

          <div className="mt-10">
            <Logo size={48} variant="full" showText={false} />

            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
              Reset your password
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#718079]">
              Enter the email on your account and we'll generate a reset link.
            </p>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-[#52615a]">
                  Email address
                </span>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]"
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#173b31] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#285b4c] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              <div className="rounded-2xl bg-[#edf4ef] px-4 py-3 text-sm leading-6 text-[#285b4c]">
                {result.message}
              </div>

              <p className="text-xs text-[#87928c]">
                Check your inbox (and spam folder) for the reset link. It expires in 30 minutes.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
