import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, CheckCircle2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import apiRequest from "../../lib/api"
import Logo from "../../components/Logo"

export default function Settings() {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [google, setGoogle] = useState(null)
  const [loadingGoogle, setLoadingGoogle] = useState(true)
  const [googleError, setGoogleError] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const loadGoogleStatus = () => {
    setLoadingGoogle(true)
    apiRequest("/admin/google/status")
      .then((data) => setGoogle(data))
      .catch((error) => setGoogleError(error.message || "Unable to check Google Calendar status."))
      .finally(() => setLoadingGoogle(false))
  }

  useEffect(() => {
    loadGoogleStatus()
  }, [])

  const callbackResult = searchParams.get("google")

  useEffect(() => {
    if (!callbackResult) return
    // Clear the query param so a page refresh doesn't re-show the banner.
    const next = new URLSearchParams(searchParams)
    next.delete("google")
    next.delete("reason")
    setSearchParams(next, { replace: true })
  }, [callbackResult, searchParams, setSearchParams])

  const connectGoogle = async () => {
    setConnecting(true)
    setGoogleError("")
    try {
      const { url } = await apiRequest("/admin/google/connect")
      window.location.href = url
    } catch (error) {
      setGoogleError(error.message || "Unable to start the Google connection.")
      setConnecting(false)
    }
  }

  const disconnectGoogle = async () => {
    setDisconnecting(true)
    try {
      await apiRequest("/admin/google/disconnect", { method: "POST" })
      loadGoogleStatus()
    } catch (error) {
      setGoogleError(error.message || "Unable to disconnect Google Calendar.")
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Your account</p>
              <h1 className="mt-1 text-xl font-semibold">Settings</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-xs font-semibold text-[#285b4c]">
                ← Overview
              </Link>
              <button onClick={logout} className="text-xs font-semibold text-[#52615a]">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Clinic settings</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Account</h2>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
            <Row label="Name" value={user?.name || "Not set"} />
            <Row label="Email" value={user?.email} />
            <Row label="Phone" value={user?.phone || "Not recorded"} />
            <Row label="Role" value={user?.role} last />
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Integrations</p>
            <h2 className="mt-2 text-xl font-semibold">Google Calendar & Meet</h2>
            <p className="mt-2 text-sm leading-6 text-[#718079]">
              Connect a Google account so booked appointments automatically create a real Calendar event — and,
              for online consultations, a Google Meet link.
            </p>
          </div>

          {callbackResult === "connected" && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#e4f1e7] px-4 py-3 text-sm text-[#397051]">
              <CheckCircle2 size={16} />
              Google Calendar connected successfully.
            </div>
          )}

          {callbackResult === "error" && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              Google Calendar connection failed{searchParams.get("reason") ? ` (${searchParams.get("reason")})` : ""}.
              Please try again.
            </div>
          )}

          {googleError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{googleError}</p>}

          <div className="mt-4 rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
            {loadingGoogle ? (
              <div className="h-16 animate-pulse rounded-2xl bg-[#f1f4f1]" />
            ) : google?.connected ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dcebe1] text-[#285b4c]">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Connected</p>
                    <p className="mt-1 text-xs text-[#718079]">{google.email || "Connected Google account"}</p>
                  </div>
                </div>

                <button
                  onClick={disconnectGoogle}
                  disabled={disconnecting}
                  className="rounded-full border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 disabled:opacity-60"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f4f1] text-[#87928c]">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Not connected</p>
                    <p className="mt-1 text-xs text-[#718079]">
                      Appointments won't sync to Google Calendar until this is connected.
                    </p>
                  </div>
                </div>

                <button
                  onClick={connectGoogle}
                  disabled={connecting}
                  className="rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {connecting ? "Redirecting…" : "Connect Google Calendar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between px-6 py-5 ${!last ? "border-b border-[#edf0ed]" : ""}`}>
      <span className="text-xs text-[#87928c]">{label}</span>
      <span className="text-sm font-semibold capitalize">{value}</span>
    </div>
  )
}

function AdminSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 hidden w-64 border-r border-[#e1e6e2] bg-white px-5 py-7 lg:block">
      <Link to="/" className="px-3">
        <Logo size={36} textClassName="block text-sm font-bold tracking-[0.17em]" subClassName="block text-[9px] tracking-wide text-[#87928c]" />
      </Link>

      <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0aaa5]">Clinic</p>

      <nav className="mt-3 space-y-2">
        <AdminNav to="/admin" label="⌂  Overview" />
        <AdminNav to="/admin/appointments" label="📅  Appointments" />
        <AdminNav to="/admin/patients" label="🐾  Patients" />
        <AdminNav to="/admin/doctors" label="🩺  Doctors" />
        <AdminNav to="/admin/services" label="✚  Services" />
        <AdminNav to="/admin/settings" label="⚙  Settings" active />
      </nav>
    </aside>
  )
}

function AdminNav({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`block rounded-xl px-4 py-3 text-sm font-medium ${
        active ? "bg-[#e7f0e9] text-[#285b4c]" : "text-[#718079] hover:bg-[#f5f7f5]"
      }`}
    >
      {label}
    </Link>
  )
}
