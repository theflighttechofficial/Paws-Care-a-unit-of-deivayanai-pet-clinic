import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Lock, Mail, User } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import Logo from "../components/Logo"

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  })
  const [error, setError] = useState("")

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    try {
      const data = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      })

      navigate("/dashboard")
      return data
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-[#173b31]/10 sm:p-12"
        >
          <Link to="/">
            <Logo size={56} variant="full" subClassName="mt-1 block text-[9px] tracking-wide text-[#87928c]" />
          </Link>

          <div className="mt-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">
              Create your account
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              Let's get started.
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#718079]">
              Create your account to manage your pets and appointments.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <Input
              icon={User}
              label="Full name"
              placeholder="Your name"
              value={form.name}
              onChange={(value) => update("name", value)}
            />

            <Input
              icon={Mail}
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(value) => update("email", value)}
            />

            <Input
              icon={Lock}
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(value) => update("password", value)}
            />

            <Input
              icon={User}
              label="Phone number"
              type="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={(value) => update("phone", value)}
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#173b31] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
            >
              Create Account
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#718079]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#285b4c]"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function Input({
  icon: Icon,
  label,
  type = "text",
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