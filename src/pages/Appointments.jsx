import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  Clock3,
  MapPin,
  Video,
  Phone,
  ChevronRight,
  X,
  Check,
  CreditCard,
  Plus,
  Stethoscope,
  PawPrint,
} from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../lib/api"
import { buildGoogleCalendarLink } from "../lib/googleCalendarLink"
import { useAuth } from "../context/AuthContext"
import Logo from "../components/Logo"
import AnimatedEmptyState from "../components/EmptyState"
import PaymentGate from "../components/PaymentGate"
import { CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "../lib/clinicInfo"

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

const shortDate = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value))
const fullDate = (value) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(value))

const tabs = ["Upcoming", "Past", "Cancelled"]

export default function Appointments() {
  const { user, logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [petCount, setPetCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("Upcoming")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [payingAppointment, setPayingAppointment] = useState(null)

  const markAppointmentPaid = (appointmentId) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment._id === appointmentId ? { ...appointment, paymentStatus: "paid" } : appointment
      )
    )
    setPayingAppointment(null)
  }

  useEffect(() => {
    Promise.all([apiRequest("/appointments/owner/mine"), apiRequest("/pets")])
      .then(([appointmentsResponse, petsResponse]) => {
        setAppointments(appointmentsResponse.appointments || [])
        setPetCount((petsResponse.pets || []).length)
      })
      .catch((requestError) => setError(requestError.message || "Unable to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = useMemo(() => appointments.filter((appointment) => ["pending", "confirmed"].includes(appointment.status)), [appointments])
  const past = useMemo(() => appointments.filter((appointment) => appointment.status === "completed"), [appointments])
  const cancelled = useMemo(() => appointments.filter((appointment) => appointment.status === "cancelled"), [appointments])

  const filteredAppointments = activeTab === "Upcoming" ? upcoming : activeTab === "Past" ? past : cancelled

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const response = await apiRequest(`/appointments/${cancelTarget._id}/cancel`, { method: "PATCH" })
      setAppointments((current) => current.map((appointment) => (appointment._id === response.appointment._id ? response.appointment : appointment)))
      setCancelTarget(null)
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel the appointment.")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      {/* Header */}
      <header className="border-b border-[#e1e6e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/dashboard">
            <Logo size={40} />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/booking"
              className="flex items-center gap-2 rounded-full bg-[#173b31] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#285b4c]"
            >
              <Plus size={14} />
              Book appointment
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

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
            My care
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
            Appointments
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#718079]">
            Keep track of upcoming visits, consultations and your
            pet's care history.
          </p>
        </motion.div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Upcoming"
            value={loading ? "…" : upcoming.length}
            icon={CalendarDays}
            description="Scheduled visits"
          />

          <SummaryCard
            label="Completed"
            value={loading ? "…" : past.length}
            icon={Check}
            description="Visits completed"
          />

          <SummaryCard
            label="Pets"
            value={loading ? "…" : petCount}
            icon={PawPrint}
            description="Under your care"
          />
        </div>

        {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Tabs */}
        <div className="mt-10 flex items-center gap-1 rounded-2xl bg-[#e9eeea] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 rounded-xl px-4 py-3 text-xs font-semibold transition ${
                activeTab === tab
                  ? "bg-white text-[#173b31] shadow-sm"
                  : "text-[#87928c] hover:text-[#52615a]"
              }`}
            >
              {tab}

              {tab === "Upcoming" && upcoming.length > 0 && (
                <span className="ml-2 rounded-full bg-[#dcebe1] px-1.5 py-0.5 text-[9px] text-[#285b4c]">
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointment list */}
        <div className="mt-6">
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-[2rem] bg-white" />
              ))}
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {!loading && filteredAppointments.length > 0 ? (
              filteredAppointments.map(
                (appointment, index) => (
                  <motion.div
                    key={appointment._id}
                    layout
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                    }}
                    transition={{
                      delay: index * 0.05,
                    }}
                    className="mb-4"
                  >
                    <AppointmentCard
                      appointment={appointment}
                      onView={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                      onCancel={() =>
                        setCancelTarget(appointment)
                      }
                      onPayNow={() => setPayingAppointment(appointment)}
                    />
                  </motion.div>
                )
              )
            ) : (
              <EmptyState tab={activeTab} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Details modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <DetailsModal
            appointment={selectedAppointment}
            onClose={() =>
              setSelectedAppointment(null)
            }
            onPayNow={() => {
              setSelectedAppointment(null)
              setPayingAppointment(selectedAppointment)
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment modal */}
      <AnimatePresence>
        {payingAppointment && (
          <Modal onClose={() => setPayingAppointment(null)}>
            <div className="p-2">
              <PaymentGate
                purpose="online_consultation"
                appointmentId={payingAppointment._id}
                user={user}
                title="Pay to confirm your online consultation"
                description="Pay the consultation fee to get the call-to-confirm number and your Google Meet link."
                onPaid={() => markAppointmentPaid(payingAppointment._id)}
                onBack={() => setPayingAppointment(null)}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            appointment={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={confirmCancel}
            cancelling={cancelling}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-3xl border border-[#e1e7e2] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#87928c]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-[#9aa49f]">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ee] text-[#285b4c]">
          <Icon size={17} />
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({
  appointment,
  onView,
  onCancel,
  onPayNow,
}) {
  const isOnline = appointment.type === "online"
  const isCompleted =
    appointment.status === "completed"
  const isPaid = appointment.paymentStatus === "paid"

  return (
    <div className="group overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white transition hover:border-[#cbd8cf] hover:shadow-sm">
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {/* Date */}
          <div className="flex shrink-0 items-center gap-4 md:w-32 md:flex-col md:gap-1 md:border-r md:border-[#edf0ed] md:pr-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ee] text-[#285b4c] md:h-14 md:w-14">
              <CalendarDays size={20} />
            </div>

            <div className="md:text-center">
              <p className="text-lg font-semibold">
                {shortDate(appointment.date)}
              </p>

              <p className="text-[10px] text-[#87928c]">
                {appointment.startTime}
              </p>
            </div>
          </div>

          {/* Main information */}
          <div className="flex flex-1 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0f3ef] text-2xl">
              {petEmoji[appointment.pet?.species] || "🐾"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">
                  {appointment.pet?.name}
                </h3>

                <StatusBadge
                  status={appointment.status}
                />
              </div>

              <p className="mt-1 text-sm text-[#52615a]">
                {appointment.service}
              </p>

              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#87928c]">
                <span className="flex items-center gap-1">
                  <Stethoscope size={11} />
                  {appointment.doctor?.name}
                </span>

                <span className="flex items-center gap-1">
                  {isOnline ? (
                    <Video size={11} />
                  ) : appointment.type === "phone" ? (
                    <Phone size={11} />
                  ) : (
                    <MapPin size={11} />
                  )}

                  {isOnline
                    ? "Online"
                    : appointment.type === "phone"
                    ? "Phone"
                    : "Clinic visit"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 md:flex-col">
            <button
              onClick={onView}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#dfe6e1] px-4 py-2.5 text-[10px] font-semibold text-[#52615a] transition hover:bg-[#f5f7f5] md:flex-none"
            >
              View details
              <ChevronRight size={12} />
            </button>

            {appointment.status !== "cancelled" && (
              <a
                href={buildGoogleCalendarLink(appointment)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#dfe6e1] px-4 py-2.5 text-[10px] font-semibold text-[#52615a] transition hover:bg-[#f5f7f5] md:flex-none"
              >
                <CalendarDays size={12} />
                Add to calendar
              </a>
            )}

            {!isCompleted && (
              <button
                onClick={onCancel}
                className="rounded-full px-4 py-2.5 text-[10px] font-semibold text-[#a06b68] transition hover:bg-[#faf2f1]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Online appointment CTA */}
        {isOnline && !isCompleted && !isPaid && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#faf2f1] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#a06b68]">
                <CreditCard size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold">Payment required</p>
                <p className="mt-0.5 text-[10px] text-[#87928c]">
                  Pay the consultation fee to get the call-to-confirm number and Google Meet link.
                </p>
              </div>
            </div>

            <button
              onClick={onPayNow}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-[10px] font-semibold text-white"
            >
              <CreditCard size={12} />
              Pay now
            </button>
          </div>
        )}

        {isOnline && !isCompleted && isPaid && (
          <div className="mt-5 rounded-2xl bg-[#edf4ef] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#285b4c]">
                  <Phone size={15} />
                </div>

                <div>
                  <p className="text-xs font-semibold">Step 1 — call to confirm</p>
                  <p className="mt-0.5 text-[10px] text-[#718079]">
                    Call {CLINIC_PHONE_DISPLAY} before your slot to confirm this consultation.
                  </p>
                </div>
              </div>

              <a
                href={`tel:${CLINIC_PHONE_TEL}`}
                className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-[10px] font-semibold text-white"
              >
                <Phone size={12} />
                {CLINIC_PHONE_DISPLAY}
              </a>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#dbe7dd] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#285b4c]">
                  <Video size={15} />
                </div>

                <div>
                  <p className="text-xs font-semibold">Step 2 — join Google Meet</p>
                  <p className="mt-0.5 text-[10px] text-[#718079]">
                    {appointment.googleMeetLink
                      ? "Google Meet link is ready for your appointment."
                      : "Google Calendar integration is not configured."}
                  </p>
                </div>
              </div>

              {appointment.googleMeetLink ? (
                <a
                  href={appointment.googleMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#173b31] px-5 py-2.5 text-[10px] font-semibold text-[#173b31]"
                >
                  <Video size={12} />
                  Join Google Meet
                </a>
              ) : (
                <span className="text-[10px] font-semibold text-[#718079]">
                  Meeting link pending
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    confirmed: {
      label: "Confirmed",
      className:
        "bg-[#e4f1e7] text-[#397051]",
    },
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700",
    },
    completed: {
      label: "Completed",
      className:
        "bg-[#edf0ee] text-[#69756f]",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-[#f8e9e7] text-[#a06b68]",
    },
  }

  const current =
    config[status] || config.confirmed

  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  )
}

function EmptyState({ tab }) {
  return (
    <AnimatedEmptyState
      title={`No ${tab.toLowerCase()} appointments`}
      description={
        tab === "Upcoming"
          ? "You don't have any upcoming visits. Book an appointment when your pet needs care."
          : `Your ${tab.toLowerCase()} appointments will appear here.`
      }
      action={
        tab === "Upcoming" && (
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-3 text-[10px] font-semibold text-white"
          >
            <Plus size={13} />
            Book appointment
          </Link>
        )
      }
    />
  )
}

function DetailsModal({
  appointment,
  onClose,
  onPayNow,
}) {
  const isOnline =
    appointment.type === "online"
  const isPaid = appointment.paymentStatus === "paid"

  return (
    <Modal onClose={onClose}>
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4c806c]">
              Appointment details
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {appointment.pet?.name}'s visit
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f4f1] text-[#718079]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-7 space-y-4">
          <DetailItem
            icon={PawPrint}
            label="Pet"
            value={appointment.pet?.name}
          />

          <DetailItem
            icon={Stethoscope}
            label="Service"
            value={appointment.service}
          />

          <DetailItem
            icon={Stethoscope}
            label="Veterinarian"
            value={appointment.doctor?.name}
            secondary={appointment.doctor?.specialty}
          />

          <DetailItem
            label="Date"
            value={fullDate(appointment.date)}
          />

          <DetailItem
            icon={Clock3}
            label="Time"
            value={`${appointment.startTime} · ${appointment.duration || 30} min`}
          />

          <DetailItem
            icon={
              isOnline
                ? Video
                : appointment.type === "phone"
                ? Phone
                : MapPin
            }
            label="Consultation"
            value={
              isOnline
                ? "Online consultation"
                : appointment.type === "phone"
                ? "Phone consultation"
                : "Clinic visit"
            }
          />
        </div>

        {isOnline && !isPaid && (
          <div className="mt-7 rounded-2xl bg-[#faf2f1] p-5 text-center">
            <p className="text-sm font-semibold text-[#a06b68]">Payment required</p>
            <p className="mt-1 text-xs text-[#87928c]">
              Pay the consultation fee to get the call-to-confirm number and Google Meet link.
            </p>
            <button
              onClick={onPayNow}
              className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-full bg-[#173b31] px-6 py-3 text-xs font-semibold text-white"
            >
              <CreditCard size={14} />
              Pay now
            </button>
          </div>
        )}

        {isOnline && isPaid && (
          <div className="mt-7 space-y-3">
            <a
              href={`tel:${CLINIC_PHONE_TEL}`}
              className="flex items-center justify-center gap-2 rounded-full border border-[#173b31] py-3.5 text-xs font-semibold text-[#173b31]"
            >
              <Phone size={15} />
              Step 1 — call {CLINIC_PHONE_DISPLAY} to confirm
            </a>

            {appointment.googleMeetLink ? (
              <a
                href={appointment.googleMeetLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-[#173b31] py-3.5 text-xs font-semibold text-white"
              >
                <Video size={15} />
                Step 2 — join Google Meet
              </a>
            ) : (
              <div className="rounded-2xl bg-[#edf4ef] p-4 text-xs text-[#52615a]">
                Google Calendar integration is not configured. The appointment remains saved, and the Meet link will appear here once the Google configuration is enabled.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
  secondary,
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-[#f7f9f7] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4c806c]">
        <Icon size={15} />
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9aa49f]">
          {label}
        </p>

        <p className="mt-1 text-xs font-semibold">
          {value}
        </p>

        {secondary && (
          <p className="mt-0.5 text-[10px] text-[#87928c]">
            {secondary}
          </p>
        )}
      </div>
    </div>
  )
}

function CancelModal({
  appointment,
  onClose,
  onConfirm,
  cancelling,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8e9e7] text-[#a06b68]">
          <X size={22} />
        </div>

        <h2 className="mt-5 text-xl font-semibold">
          Cancel appointment?
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#87928c]">
          You're cancelling {appointment.pet?.name}'s{" "}
          {appointment.service} on {shortDate(appointment.date)} at{" "}
          {appointment.startTime}.
        </p>

        <div className="mt-7 flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 rounded-full border border-[#dfe6e1] py-3 text-xs font-semibold text-[#52615a] disabled:opacity-60"
          >
            Keep appointment
          </button>

          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="flex-1 rounded-full bg-[#9a5f5b] py-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {cancelling ? "Cancelling…" : "Cancel appointment"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17221e]/40 p-5 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </motion.div>
    </motion.div>
  )
}