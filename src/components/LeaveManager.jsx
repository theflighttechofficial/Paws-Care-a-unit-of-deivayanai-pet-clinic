import { useState } from "react"
import { CalendarOff, Plus, X } from "lucide-react"

const formatLeaveDate = (value) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  )

// Reusable "mark a day as leave" widget. Used by doctors (their own
// calendar) and admins (any doctor's calendar) — the parent supplies the
// data + handlers so this stays agnostic of which API it's hitting.
export default function LeaveManager({ leaves, onAdd, onRemove, loading, doctorOptions }) {
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [doctorId, setDoctorId] = useState(doctorOptions?.[0]?.id || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const todayIso = new Date().toISOString().slice(0, 10)

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!date) return
    if (doctorOptions && !doctorId) return

    setError("")
    setSaving(true)
    try {
      await onAdd(date, reason, doctorId)
      setDate("")
      setReason("")
    } catch (err) {
      setError(err.message || "Unable to mark this day as leave.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e9e7] text-[#a06b68]">
          <CalendarOff size={17} />
        </div>
        <div>
          <h3 className="font-semibold">Leave days</h3>
          <p className="mt-0.5 text-xs text-[#87928c]">Days marked here are blocked from booking.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-5 flex flex-col gap-3 sm:flex-row">
        {doctorOptions && (
          <select
            required
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
            className="rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-3 py-2.5 text-sm outline-none focus:border-[#4c806c]"
          >
            {doctorOptions.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        )}

        <input
          required
          type="date"
          min={todayIso}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="flex-1 rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-3 py-2.5 text-sm outline-none focus:border-[#4c806c]"
        />
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 rounded-xl border border-[#dfe6e1] bg-[#fbfcfb] px-3 py-2.5 text-sm outline-none focus:border-[#4c806c]"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#173b31] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Plus size={14} />
          {saving ? "Saving…" : "Mark as leave"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-5 space-y-2">
        {loading && <p className="text-xs text-[#87928c]">Loading…</p>}

        {!loading && leaves.length === 0 && (
          <p className="text-xs text-[#87928c]">No upcoming leave days.</p>
        )}

        {!loading &&
          leaves.map((leave) => (
            <div
              key={leave.id}
              className="flex items-center justify-between rounded-xl bg-[#f7f9f7] px-4 py-2.5 text-xs"
            >
              <div>
                <span className="font-semibold">{formatLeaveDate(leave.leave_date)}</span>
                {leave.reason && <span className="ml-2 text-[#87928c]">· {leave.reason}</span>}
                {leave.doctor_name && <span className="ml-2 text-[#87928c]">· Dr. {leave.doctor_name}</span>}
              </div>
              <button
                onClick={() => onRemove(leave)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#a06b68] hover:bg-[#f8e9e7]"
                aria-label="Remove leave day"
              >
                <X size={13} />
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
