import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Settings,
  Stethoscope,
  Users,
  Video,
} from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"

const todayLabel = () =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date())

const todayShortLabel = () =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      apiRequest("/admin/stats"),
      apiRequest("/admin/appointments"),
      apiRequest("/appointments/doctors"),
    ])
      .then(([statsResponse, appointmentsResponse, doctorsResponse]) => {
        setStats(statsResponse.stats)
        setAppointments(appointmentsResponse.appointments || [])
        setDoctors(doctorsResponse.doctors || [])
      })
      .catch((requestError) => setError(requestError.message || "Unable to load clinic data."))
      .finally(() => setLoading(false))
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)
  const todaysAppointments = appointments.filter((appointment) => appointment.date === todayIso)
  const onlineToday = todaysAppointments.filter((appointment) => appointment.type === "online").length
  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length
  const totalSlotsToday = todaysAppointments.length
  const filledToday = todaysAppointments.filter((appointment) => appointment.status !== "cancelled").length
  const capacityPercent = totalSlotsToday ? Math.round((filledToday / totalSlotsToday) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="overview" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">
                {todayLabel()}
              </p>

              <h1 className="mt-1 text-xl font-semibold">
                Good day, Admin
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={logout} className="text-xs font-semibold text-[#52615a]">
                Sign out
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173b31] text-sm font-semibold text-white">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          {/* HEADER */}

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">
              Clinic overview
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Today's operations
            </h2>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {/* STATS */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Total appointments"
              value={loading ? "…" : stats?.totalAppointments ?? 0}
              change={loading ? "" : `${stats?.todayAppointments ?? 0} today`}
            />

            <StatCard
              icon={Video}
              label="Online consultations today"
              value={loading ? "…" : onlineToday}
              change="Scheduled today"
            />

            <StatCard
              icon={Clock3}
              label="Pending"
              value={loading ? "…" : pendingCount}
              change="Needs attention"
            />

            <StatCard
              icon={Users}
              label="Pets on record"
              value={loading ? "…" : stats?.totalPets ?? 0}
              change={loading ? "" : `${stats?.totalOwners ?? 0} owners`}
            />
          </div>

          {/* MAIN GRID */}

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* APPOINTMENTS */}

            <section className="rounded-[2rem] border border-[#e1e7e2] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0ed] px-6 py-5">
                <div>
                  <h3 className="font-semibold">
                    Today's appointments
                  </h3>

                  <p className="mt-1 text-xs text-[#87928c]">
                    {todayShortLabel()}
                  </p>
                </div>

                <Link
                  to="/admin/appointments"
                  className="flex items-center gap-1 text-xs font-semibold text-[#285b4c]"
                >
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div>
                {!loading && todaysAppointments.length === 0 && (
                  <div className="px-6 py-4">
                    <EmptyState title="No appointments today" description="Today's schedule is clear." />
                  </div>
                )}

                {todaysAppointments.map((appointment, index) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {/* RIGHT SIDE */}

            <div className="space-y-6">
              <section className="rounded-[2rem] bg-[#173b31] p-7 text-white">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Activity size={20} />
                </div>

                <p className="mt-6 text-xs uppercase tracking-[0.15em] text-white/40">
                  Clinic activity
                </p>

                <p className="mt-2 text-4xl font-semibold">
                  {loading ? "…" : `${capacityPercent}%`}
                </p>

                <p className="mt-2 text-sm text-white/55">
                  Appointment capacity today
                </p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#8fc2a5]" style={{ width: `${capacityPercent}%` }} />
                </div>

                <p className="mt-3 text-xs text-white/40">
                  {loading ? "" : `${filledToday} of ${totalSlotsToday} appointment slots today`}
                </p>
              </section>

              <section className="rounded-[2rem] border border-[#e1e7e2] bg-white p-7">
                <h3 className="font-semibold">
                  Quick actions
                </h3>

                <div className="mt-5 space-y-2">
                  <QuickAction
                    icon={CalendarDays}
                    title="Manage appointments"
                    to="/admin/appointments"
                  />

                  <QuickAction
                    icon={Stethoscope}
                    title="Manage doctors"
                    to="/admin/doctors"
                  />

                  <QuickAction
                    icon={Users}
                    title="View patients"
                    to="/admin/patients"
                  />

                  <QuickAction
                    icon={Settings}
                    title="Clinic settings"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* DOCTORS */}

          <section className="mt-8 rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Doctor availability
                </h3>

                <p className="mt-1 text-xs text-[#87928c]">
                  Current clinic status
                </p>
              </div>

              <Link
                to="/admin/doctors"
                className="text-xs font-semibold text-[#285b4c]"
              >
                Manage doctors →
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {!loading && doctors.length === 0 && (
                <div className="md:col-span-3">
                  <EmptyState title="No doctors on record" description="Add a doctor profile to see their availability here." />
                </div>
              )}

              {doctors.map((doctor) => {
                const bookedToday = todaysAppointments.some(
                  (appointment) => (appointment.doctor?._id || appointment.doctor?.id) === (doctor._id || doctor.id) && appointment.status !== "cancelled"
                )

                return (
                  <DoctorStatus
                    key={doctor._id || doctor.id}
                    name={doctor.name}
                    specialty={doctor.specialty}
                    status={bookedToday ? "Booked today" : "Available"}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[1.75rem] border border-[#e1e7e2] bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f0e9] text-[#285b4c]">
          <Icon size={18} />
        </div>

        <span className="text-[10px] font-semibold text-[#4c806c]">
          {change}
        </span>
      </div>

      <p className="mt-6 text-xs text-[#87928c]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold">
        {value}
      </p>
    </motion.div>
  )
}

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

function AppointmentRow({
  appointment,
  index,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col gap-4 border-b border-[#edf0ed] px-6 py-5 last:border-0 sm:flex-row sm:items-center"
    >
      <div className="w-20 shrink-0">
        <p className="text-xs font-semibold">
          {appointment.startTime}
        </p>

        <p className="mt-1 text-[10px] text-[#9aa59f]">
          {appointment.type}
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-xl">
        {petEmoji[appointment.pet?.species] || "🐾"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {appointment.pet?.name}
        </p>

        <p className="mt-1 text-xs text-[#87928c]">
          {appointment.owner?.name} · {appointment.service}
        </p>
      </div>

      <div className="hidden text-right md:block">
        <p className="text-xs font-medium">
          {appointment.doctor?.name}
        </p>

        <p
          className={`mt-1 text-[10px] ${
            appointment.status === "pending"
              ? "text-amber-600"
              : "text-[#4c806c]"
          }`}
        >
          {appointment.status}
        </p>
      </div>

      <Link
        to="/admin/appointments"
        className="rounded-full border border-[#dfe6e1] px-4 py-2 text-xs font-semibold"
      >
        Details
      </Link>
    </motion.div>
  )
}

function DoctorStatus({
  name,
  specialty,
  status,
}) {
  const available = status === "Available"

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-[#f7f9f7] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dcebe1] text-[#285b4c]">
        <Stethoscope size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {name}
        </p>

        <p className="mt-1 truncate text-[10px] text-[#87928c]">
          {specialty}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            available ? "bg-[#4c806c]" : "bg-amber-500"
          }`}
        />

        <span className="hidden text-[10px] font-semibold sm:block">
          {status}
        </span>
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  to,
}) {
  const content = (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ee] text-[#285b4c]">
        <Icon size={16} />
      </div>

      <span className="flex-1 text-left text-xs font-semibold">
        {title}
      </span>

      <ChevronRight size={14} className="text-[#9aa59f]" />
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f5f7f5]"
      >
        {content}
      </Link>
    )
  }

  return (
    <button className="flex w-full items-center gap-3 rounded-xl p-2 transition hover:bg-[#f5f7f5]">
      {content}
    </button>
  )
}
