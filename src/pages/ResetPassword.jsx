import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Lock } from "lucide-react"
import Logo from "../components/Logo"
import apiRequest from "../lib/api"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
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
          <Logo size={48} variant="full" showText={false} />

          {!token ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              This reset link is missing its token. Request a new one from the{" "}
              <Link to="/forgot-password" className="font-semibold underline">
                forgot password
              </Link>{" "}
              page.
            </div>
          ) : done ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="flex items-center gap-3 rounded-2xl bg-[#edf4ef] px-4 py-3 text-sm text-[#285b4c]">
                <CheckCircle2 size={18} />
                Your password has been reset.
              </div>

              <Link
                to="/login"
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#173b31] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
              >
                Sign in
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
                Choose a new password
              </h2>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">
                    New password
                  </span>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]"
                    />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">
                    Confirm password
                  </span>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]"
                    />
                    <input
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
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
                  {loading ? "Resetting…" : "Reset password"}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
