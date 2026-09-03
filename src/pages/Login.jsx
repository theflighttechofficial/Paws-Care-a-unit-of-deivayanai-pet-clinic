import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Lock, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import Logo from "../components/Logo"
import GoogleSignInButton from "../components/GoogleSignInButton"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (event) => {
    event.preventDefault()
    setError("")

    try {
      const data = await login({ email, password })

      if (data.user.role === "admin") {
        navigate("/admin")
      } else if (data.user.role === "doctor") {
        navigate("/doctor")
      } else {
        navigate("/dashboard")
      }
    } catch (error) {
      setError(error.message || "Invalid email or password.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-[#173b31]/10 lg:grid-cols-2"
        >
          <div className="hidden bg-[#173b31] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Logo
                size={40}
                dark
                subClassName="block text-[9px] tracking-wide text-white/50"
              />

              <div className="mt-24">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a9cfba]">
                  Your pet's care
                </p>

                <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.05em]">
                  Everything your pet needs,
                  <br />
                  in one place.
                </h1>

                <p className="mt-6 max-w-md leading-7 text-white/60">
                  Manage appointments, pets and veterinary care from your
                  personal dashboard.
                </p>
              </div>
            </div>

            <p className="text-xs text-white/40">
              Compassionate care, digitally connected.
            </p>
          </div>

          <div className="p-7 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-md">
              <Link
                to="/"
                className="text-sm font-semibold text-[#52615a]"
              >
                ← Back to website
              </Link>

              <div className="mt-16">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">
                  Welcome back
                </p>

                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                  Sign in
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#718079]">
                  Access your pet's appointments and health information.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-10 space-y-5">
                <Input
                  icon={Mail}
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                />

                <Input
                  icon={Lock}
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                />

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#4c806c]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#173b31] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
                >
                  Sign in
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </form>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#e1e6e2]" />
                <span className="text-xs text-[#a0aaa5]">or</span>
                <div className="h-px flex-1 bg-[#e1e6e2]" />
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleSignInButton />
              </div>

              <p className="mt-8 text-center text-sm text-[#718079]">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#285b4c]"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Input({
  icon: Icon,
  label,
  type,
  placeholder,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#52615a]">
        {label}
      </span>

      <div className="relative">
        <Icon
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]"
        />

        <input
          required
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
        />
      </div>
    </label>
  )
}