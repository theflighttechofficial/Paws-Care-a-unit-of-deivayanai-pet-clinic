import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Search,
  Video,
} from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"

const statusOptions = ["All", "confirmed", "pending", "completed", "cancelled"]

export default function Appointments() {
  const { logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")

  useEffect(() => {
    apiRequest("/admin/appointments")
      .then((response) => setAppointments(response.appointments || []))
      .catch((requestError) => setError(requestError.message || "Unable to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const term = search.toLowerCase()
      const matchesSearch =
        !term ||
        appointment.pet?.name?.toLowerCase().includes(term) ||
        appointment.owner?.name?.toLowerCase().includes(term) ||
        appointment.doctor?.name?.toLowerCase().includes(term)

      const matchesStatus = status === "All" || appointment.status === status

      return matchesSearch && matchesStatus
    })
  }, [appointments, search, status])

  const updateStatus = async (id, newStatus) => {
    const previous = appointments
    setAppointments((current) =>
      current.map((appointment) => (appointment._id === id ? { ...appointment, status: newStatus } : appointment))
    )

    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (requestError) {
      setAppointments(previous)
      setError(requestError.message || "Unable to update appointment status.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="appointments" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">
                Clinic management
              </p>

              <h1 className="mt-1 text-xl font-semibold">
                Appointments
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="text-xs font-semibold text-[#285b4c]"
              >
                ← Overview
              </Link>

              <button
                onClick={logout}
                className="text-xs font-semibold text-[#52615a]"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">
              Schedule
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Manage appointments
            </h2>
          </div>

          {/* TOOLBAR */}

          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search pet, owner or doctor..."
                className="w-full rounded-2xl border border-[#dfe6e1] bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[#4c806c]"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87928c]"
              />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="appearance-none rounded-2xl border border-[#dfe6e1] bg-white py-3.5 pl-10 pr-10 text-sm outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All" : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>

            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#dfe6e1] bg-white px-5 py-3 text-sm font-semibold">
              <CalendarDays size={16} />
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}
            </div>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {/* APPOINTMENTS */}

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
            <div className="hidden grid-cols-[100px_1.1fr_1fr_1fr_120px_40px] gap-4 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f] md:grid">
              <span>Time</span>
              <span>Patient</span>
              <span>Service</span>
              <span>Doctor</span>
              <span>Status</span>
              <span />
            </div>

            {loading && (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f1f4f1]" />
                ))}
              </div>
            )}

            {!loading &&
              filteredAppointments.map((appointment) => (
                <AppointmentRow
                  key={appointment._id}
                  appointment={appointment}
                  onStatusChange={updateStatus}
                />
              ))}

            {!loading && filteredAppointments.length === 0 && (
              <EmptyState
                title="No appointments found"
                description="Try changing your search or filter."
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

function AppointmentRow({
  appointment,
  onStatusChange,
}) {
  return (
    <div className="border-b border-[#edf0ed] px-6 py-5 last:border-0">
      <div className="grid gap-5 md:grid-cols-[100px_1.1fr_1fr_1fr_120px_40px] md:items-center md:gap-4">
        <div>
          <p className="text-sm font-semibold">
            {appointment.startTime}
          </p>

          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#87928c]">
            {appointment.type === "online" && (
              <Video size={11} />
            )}

            {appointment.type}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ef]">
            {petEmoji[appointment.pet?.species] || "🐾"}
          </div>

          <div>
            <p className="text-sm font-semibold">
              {appointment.pet?.name}
            </p>

            <p className="mt-1 text-[10px] text-[#87928c]">
              {appointment.owner?.name}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium">
            {appointment.service}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium">
            {appointment.doctor?.name}
          </p>
        </div>

        <div>
          <select
            value={appointment.status}
            onChange={(event) =>
              onStatusChange(
                appointment._id,
                event.target.value
              )
            }
            className={`rounded-full border-0 px-3 py-1.5 text-[10px] font-semibold outline-none ${
              appointment.status === "confirmed"
                ? "bg-[#e6f1e9] text-[#285b4c]"
                : appointment.status === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : appointment.status === "completed"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-600"
            }`}
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f5f3]">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
