import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronDown,
  Filter,
  Search,
  Trash2,
  Video,
  XCircle,
} from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"

const statusOptions = ["All", "confirmed", "pending", "completed", "cancelled"]

const formatDateLabel = (value) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

export default function Appointments() {
  const { logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [dateFilter, setDateFilter] = useState("All")
  const [markPaidTarget, setMarkPaidTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    apiRequest("/admin/appointments")
      .then((response) => setAppointments(response.appointments || []))
      .catch((requestError) => setError(requestError.message || "Unable to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  // Distinct appointment dates, in the exact form they come back from the
  // API — used as-is for both the filter dropdown and grouping, so there's
  // no risk of a display/filter mismatch from re-deriving the date twice.
  const availableDates = useMemo(() => {
    const seen = new Map()
    for (const appointment of appointments) {
      if (appointment.date && !seen.has(appointment.date)) seen.set(appointment.date, formatDateLabel(appointment.date))
    }
    return [...seen.entries()].sort(([a], [b]) => new Date(a) - new Date(b))
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const term = search.toLowerCase()
      const matchesSearch =
        !term ||
        appointment.pet?.name?.toLowerCase().includes(term) ||
        appointment.owner?.name?.toLowerCase().includes(term) ||
        appointment.doctor?.name?.toLowerCase().includes(term)

      const matchesStatus = status === "All" || appointment.status === status
      const matchesDate = dateFilter === "All" || appointment.date === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [appointments, search, status, dateFilter])

  // Grouped by date (ascending) so the list reads as a day-by-day
  // schedule instead of one long undifferentiated table.
  const groupedByDate = useMemo(() => {
    const groups = new Map()
    for (const appointment of filteredAppointments) {
      const key = appointment.date || "unknown"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(appointment)
    }
    return [...groups.entries()].sort(([a], [b]) => new Date(a) - new Date(b))
  }, [filteredAppointments])

  const deleteAppointment = async (id) => {
    if (!window.confirm("Permanently delete this appointment? This can't be undone.")) return
    setDeletingId(id)
    try {
      await apiRequest(`/admin/appointments/${id}`, { method: "DELETE" })
      setAppointments((current) => current.filter((appointment) => appointment._id !== id))
    } catch (requestError) {
      setError(requestError.message || "Unable to delete appointment.")
    } finally {
      setDeletingId(null)
    }
  }

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

  const recordPayment = async (form) => {
    const response = await apiRequest("/admin/payments", {
      method: "POST",
      body: JSON.stringify({ appointmentId: markPaidTarget._id, ...form }),
    })
    setAppointments((current) =>
      current.map((appointment) =>
        appointment._id === markPaidTarget._id
          ? { ...appointment, paymentStatus: response.payment.status, paymentMethod: response.payment.method }
          : appointment
      )
    )
    setMarkPaidTarget(null)
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

            <div className="relative">
              <CalendarDays
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87928c]"
              />

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="appearance-none rounded-2xl border border-[#dfe6e1] bg-white py-3.5 pl-10 pr-10 text-sm outline-none"
              >
                <option value="All">All dates</option>
                {availableDates.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {/* APPOINTMENTS, grouped date-wise */}

          {loading && (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f1f4f1]" />
              ))}
            </div>
          )}

          {!loading &&
            groupedByDate.map(([dateValue, dateAppointments]) => (
              <div key={dateValue} className="mt-6 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
                <div className="flex items-center gap-2 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-3.5 text-xs font-semibold text-[#285b4c]">
                  <CalendarDays size={13} />
                  {formatDateLabel(dateValue)}
                  <span className="ml-1 text-[10px] font-normal text-[#9aa59f]">
                    ({dateAppointments.length} appointment{dateAppointments.length === 1 ? "" : "s"})
                  </span>
                </div>

                <div className="hidden grid-cols-[100px_1fr_1fr_0.9fr_110px_100px_110px] gap-4 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f] md:grid">
                  <span>Time</span>
                  <span>Patient</span>
                  <span>Service</span>
                  <span>Doctor</span>
                  <span>Status</span>
                  <span>Payment</span>
                  <span />
                </div>

                {dateAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    onStatusChange={updateStatus}
                    onMarkPaid={setMarkPaidTarget}
                    onDelete={deleteAppointment}
                    deleting={deletingId === appointment._id}
                  />
                ))}
              </div>
            ))}

          {!loading && filteredAppointments.length === 0 && (
            <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
              <EmptyState
                title="No appointments found"
                description="Try changing your search or filter."
              />
            </div>
          )}
        </div>
      </main>

      {markPaidTarget && (
        <MarkPaidModal
          appointment={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSave={recordPayment}
        />
      )}
    </div>
  )
}

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

function AppointmentRow({
  appointment,
  onStatusChange,
  onMarkPaid,
  onDelete,
  deleting,
}) {
  const paymentLabel = {
    paid: "Paid",
    created: "Awaiting payment",
    failed: "Payment failed",
  }[appointment.paymentStatus] || "Not required"

  const paymentStyle = {
    paid: "bg-[#e6f1e9] text-[#285b4c]",
    created: "bg-amber-50 text-amber-700",
    failed: "bg-red-50 text-red-600",
  }[appointment.paymentStatus] || "bg-[#f3f5f3] text-[#87928c]"

  const canCancel = !["cancelled", "completed"].includes(appointment.status)

  return (
    <div className="border-b border-[#edf0ed] px-6 py-5 last:border-0">
      <div className="grid gap-5 md:grid-cols-[100px_1fr_1fr_0.9fr_110px_100px_110px] md:items-center md:gap-4">
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

        <div className="flex flex-col items-start gap-1">
          <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${paymentStyle}`}>
            {paymentLabel}
          </span>
          {appointment.paymentStatus !== "paid" && appointment.status !== "cancelled" && (
            <button
              onClick={() => onMarkPaid(appointment)}
              className="text-[10px] font-semibold text-[#285b4c] underline underline-offset-2"
            >
              Mark as paid
            </button>
          )}
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <button
            onClick={() => canCancel && onStatusChange(appointment._id, "cancelled")}
            disabled={!canCancel}
            title={canCancel ? "Cancel booking" : "Already cancelled or completed"}
            className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XCircle size={12} />
            Cancel
          </button>

          <button
            onClick={() => onDelete(appointment._id)}
            disabled={deleting}
            title="Permanently delete this appointment"
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold text-[#9aa59f] hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={12} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidModal({ appointment, onClose, onSave }) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSave({ amount: Number(amount), method, notes })
    } catch (err) {
      setError(err.message || "Unable to record payment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10241d]/30 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-7">
        <h2 className="text-xl font-semibold">Mark as paid</h2>
        <p className="mt-2 text-sm text-[#718079]">
          {appointment.pet?.name} · {appointment.service} · {appointment.owner?.name}
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <label className="mt-5 block text-xs font-semibold">
          Amount (₹)
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border p-3 text-sm"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold">
          Method
          <select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 w-full rounded-xl border p-3 text-sm">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="mt-4 block text-xs font-semibold">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 min-h-16 w-full rounded-xl border p-3 text-sm"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border py-3 text-xs font-semibold">
            Cancel
          </button>
          <button disabled={saving} className="flex-1 rounded-full bg-[#173b31] py-3 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Confirm payment"}
          </button>
        </div>
      </form>
    </div>
  )
}
