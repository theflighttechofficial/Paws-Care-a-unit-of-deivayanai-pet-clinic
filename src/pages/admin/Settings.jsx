import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, CheckCircle2, Clock3, IndianRupee } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import apiRequest from "../../lib/api"
import AdminSidebar from "../../components/AdminSidebar"

const SLOT_INTERVAL_OPTIONS = [15, 20, 30, 45, 60]

const scheduleToForm = (schedule) => ({
  intervalMinutes: schedule.slotIntervalMinutes,
  weekdayMorningStart: schedule.weekdaySessions[0]?.startHour ?? 9,
  weekdayMorningEnd: schedule.weekdaySessions[0]?.endHour ?? 13,
  weekdayEveningStart: schedule.weekdaySessions[1]?.startHour ?? 16,
  weekdayEveningEnd: schedule.weekdaySessions[1]?.endHour ?? 22,
  sundayStart: schedule.sundaySessions[0]?.startHour ?? 9,
  sundayEnd: schedule.sundaySessions[0]?.endHour ?? 13,
})

export default function Settings() {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [google, setGoogle] = useState(null)
  const [loadingGoogle, setLoadingGoogle] = useState(true)
  const [googleError, setGoogleError] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const [onlineFeeInput, setOnlineFeeInput] = useState("")
  const [savingOnlineFee, setSavingOnlineFee] = useState(false)
  const [onlineFeeError, setOnlineFeeError] = useState("")
  const [onlineFeeSaved, setOnlineFeeSaved] = useState(false)

  const [phoneFeeInput, setPhoneFeeInput] = useState("")
  const [savingPhoneFee, setSavingPhoneFee] = useState(false)
  const [phoneFeeError, setPhoneFeeError] = useState("")
  const [phoneFeeSaved, setPhoneFeeSaved] = useState(false)

  const [loadingFees, setLoadingFees] = useState(true)

  const [scheduleForm, setScheduleForm] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState("")
  const [scheduleSaved, setScheduleSaved] = useState(false)

  useEffect(() => {
    apiRequest("/settings")
      .then((data) => {
        setOnlineFeeInput(String((data.onlineConsultationFeePaise ?? 0) / 100))
        setPhoneFeeInput(String((data.phoneConsultationFeePaise ?? 0) / 100))
        if (data.bookingSchedule) setScheduleForm(scheduleToForm(data.bookingSchedule))
      })
      .catch((error) => setOnlineFeeError(error.message || "Unable to load consultation fees."))
      .finally(() => {
        setLoadingFees(false)
        setLoadingSchedule(false)
      })
  }, [])

  const saveOnlineFee = async (event) => {
    event.preventDefault()
    setOnlineFeeError("")
    setOnlineFeeSaved(false)

    const rupees = Number(onlineFeeInput)
    if (!Number.isFinite(rupees) || rupees < 1) {
      setOnlineFeeError("Enter a valid amount (minimum ₹1).")
      return
    }

    setSavingOnlineFee(true)
    try {
      const data = await apiRequest("/admin/settings/fee/online", {
        method: "PUT",
        body: JSON.stringify({ amountPaise: Math.round(rupees * 100) }),
      })
      setOnlineFeeInput(String((data.onlineConsultationFeePaise ?? 0) / 100))
      setOnlineFeeSaved(true)
    } catch (error) {
      setOnlineFeeError(error.message || "Unable to update the fee.")
    } finally {
      setSavingOnlineFee(false)
    }
  }

  const savePhoneFee = async (event) => {
    event.preventDefault()
    setPhoneFeeError("")
    setPhoneFeeSaved(false)

    const rupees = Number(phoneFeeInput)
    if (!Number.isFinite(rupees) || rupees < 1) {
      setPhoneFeeError("Enter a valid amount (minimum ₹1).")
      return
    }

    setSavingPhoneFee(true)
    try {
      const data = await apiRequest("/admin/settings/fee/phone", {
        method: "PUT",
        body: JSON.stringify({ amountPaise: Math.round(rupees * 100) }),
      })
      setPhoneFeeInput(String((data.phoneConsultationFeePaise ?? 0) / 100))
      setPhoneFeeSaved(true)
    } catch (error) {
      setPhoneFeeError(error.message || "Unable to update the fee.")
    } finally {
      setSavingPhoneFee(false)
    }
  }

  const updateScheduleField = (field, value) => {
    setScheduleForm((current) => ({ ...current, [field]: value }))
  }

  const saveSchedule = async (event) => {
    event.preventDefault()
    setScheduleError("")
    setScheduleSaved(false)

    const {
      intervalMinutes,
      weekdayMorningStart,
      weekdayMorningEnd,
      weekdayEveningStart,
      weekdayEveningEnd,
      sundayStart,
      sundayEnd,
    } = scheduleForm

    if (weekdayMorningStart >= weekdayMorningEnd || weekdayEveningStart >= weekdayEveningEnd || sundayStart >= sundayEnd) {
      setScheduleError("Each session's start hour must be before its end hour.")
      return
    }

    setSavingSchedule(true)
    try {
      const data = await apiRequest("/admin/settings/schedule", {
        method: "PUT",
        body: JSON.stringify({
          slotIntervalMinutes: Number(intervalMinutes),
          weekdaySessions: [
            { startHour: Number(weekdayMorningStart), endHour: Number(weekdayMorningEnd) },
            { startHour: Number(weekdayEveningStart), endHour: Number(weekdayEveningEnd) },
          ],
          sundaySessions: [{ startHour: Number(sundayStart), endHour: Number(sundayEnd) }],
        }),
      })
      setScheduleForm(scheduleToForm(data.bookingSchedule))
      setScheduleSaved(true)
    } catch (error) {
      setScheduleError(error.message || "Unable to update the booking schedule.")
    } finally {
      setSavingSchedule(false)
    }
  }

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
      <AdminSidebar active="settings" />

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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Payments</p>
            <h2 className="mt-2 text-xl font-semibold">Consultation fees</h2>
            <p className="mt-2 text-sm leading-6 text-[#718079]">
              Online and phone consultations are priced independently via Razorpay. Clinic visits aren't charged.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FeeCard
              label="Online consultation fee"
              loading={loadingFees}
              value={onlineFeeInput}
              onChange={setOnlineFeeInput}
              onSubmit={saveOnlineFee}
              saving={savingOnlineFee}
              saved={onlineFeeSaved}
              error={onlineFeeError}
            />

            <FeeCard
              label="Phone consultation fee"
              loading={loadingFees}
              value={phoneFeeInput}
              onChange={setPhoneFeeInput}
              onSubmit={savePhoneFee}
              saving={savingPhoneFee}
              saved={phoneFeeSaved}
              error={phoneFeeError}
            />
          </div>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Scheduling</p>
            <h2 className="mt-2 text-xl font-semibold">Booking hours</h2>
            <p className="mt-2 text-sm leading-6 text-[#718079]">
              Controls which time slots owners can pick when booking — Mon–Sat has two sessions, Sundays have one.
            </p>
          </div>

          <div className="mt-4 rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
            {loadingSchedule || !scheduleForm ? (
              <div className="h-40 animate-pulse rounded-2xl bg-[#f1f4f1]" />
            ) : (
              <form onSubmit={saveSchedule} className="space-y-5">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">Mon–Sat · Morning session</span>
                  <div className="flex items-center gap-3">
                    <HourInput value={scheduleForm.weekdayMorningStart} onChange={(v) => updateScheduleField("weekdayMorningStart", v)} />
                    <span className="text-xs text-[#87928c]">to</span>
                    <HourInput value={scheduleForm.weekdayMorningEnd} onChange={(v) => updateScheduleField("weekdayMorningEnd", v)} />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">Mon–Sat · Evening session</span>
                  <div className="flex items-center gap-3">
                    <HourInput value={scheduleForm.weekdayEveningStart} onChange={(v) => updateScheduleField("weekdayEveningStart", v)} />
                    <span className="text-xs text-[#87928c]">to</span>
                    <HourInput value={scheduleForm.weekdayEveningEnd} onChange={(v) => updateScheduleField("weekdayEveningEnd", v)} />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">Sunday session</span>
                  <div className="flex items-center gap-3">
                    <HourInput value={scheduleForm.sundayStart} onChange={(v) => updateScheduleField("sundayStart", v)} />
                    <span className="text-xs text-[#87928c]">to</span>
                    <HourInput value={scheduleForm.sundayEnd} onChange={(v) => updateScheduleField("sundayEnd", v)} />
                  </div>
                </div>

                <label className="block max-w-xs">
                  <span className="mb-2 block text-xs font-semibold text-[#52615a]">Slot length</span>
                  <div className="relative">
                    <Clock3 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]" />
                    <select
                      value={scheduleForm.intervalMinutes}
                      onChange={(event) => updateScheduleField("intervalMinutes", event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
                    >
                      {SLOT_INTERVAL_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>{minutes} minutes</option>
                      ))}
                    </select>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="rounded-full bg-[#173b31] px-6 py-3 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingSchedule ? "Saving…" : "Save schedule"}
                </button>
              </form>
            )}

            {scheduleSaved && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#e4f1e7] px-4 py-3 text-sm text-[#397051]">
                <CheckCircle2 size={16} />
                Booking schedule updated.
              </div>
            )}

            {scheduleError && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{scheduleError}</p>
            )}
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
                      {google?.error
                        ? "The previous connection expired or was revoked. Reconnect to resume syncing."
                        : "Appointments won't sync to Google Calendar until this is connected."}
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

function FeeCard({ label, loading, value, onChange, onSubmit, saving, saved, error }) {
  return (
    <div className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
      <span className="mb-2 block text-xs font-semibold text-[#52615a]">{label}</span>

      {loading ? (
        <div className="h-11 animate-pulse rounded-2xl bg-[#f1f4f1]" />
      ) : (
        <form onSubmit={onSubmit} className="flex items-end gap-3">
          <div className="relative flex-1">
            <IndianRupee size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa59f]" />
            <input
              type="number"
              min="1"
              step="1"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#173b31] px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#e4f1e7] px-4 py-3 text-sm text-[#397051]">
          <CheckCircle2 size={16} />
          Updated.
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function HourInput({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-24 rounded-2xl border border-[#dfe6e1] bg-[#fbfcfb] px-3 py-2.5 text-sm outline-none transition focus:border-[#4c806c] focus:ring-4 focus:ring-[#4c806c]/10"
    >
      {Array.from({ length: 25 }, (_, hour) => (
        <option key={hour} value={hour}>
          {hour === 0 || hour === 24 ? "12:00 AM" : hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`}
        </option>
      ))}
    </select>
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
