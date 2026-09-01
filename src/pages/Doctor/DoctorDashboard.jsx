import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, ChevronRight, Clock3, MapPin, PawPrint, Users, Video } from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import Logo from "../../components/Logo"
import EmptyState from "../../components/EmptyState"
import LeaveManager from "../../components/LeaveManager"

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value))

export default function DoctorDashboard() {
  const { logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [leaves, setLeaves] = useState([])
  const [leavesLoading, setLeavesLoading] = useState(true)

  useEffect(() => {
    apiRequest("/appointments/doctor/mine")
      .then((data) => setAppointments(data.appointments))
      .catch((requestError) => setError(requestError.message || "Unable to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  const loadLeaves = () => {
    setLeavesLoading(true)
    apiRequest("/leaves/mine")
      .then((data) => setLeaves(data.leaves || []))
      .catch(() => setLeaves([]))
      .finally(() => setLeavesLoading(false))
  }

  useEffect(() => {
    loadLeaves()
  }, [])

  const addLeave = async (date, reason) => {
    await apiRequest("/leaves/mine", { method: "POST", body: JSON.stringify({ date, reason }) })
    loadLeaves()
  }

  const removeLeave = async (leave) => {
    const isoDate = new Date(leave.leave_date).toISOString().slice(0, 10)
    await apiRequest(`/leaves/mine/${isoDate}`, { method: "DELETE" })
    loadLeaves()
  }

  const active = useMemo(() => appointments.filter((item) => !["completed", "cancelled"].includes(item.status)), [appointments])
  const online = active.filter((item) => item.type === "online").length

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e1e7e2] bg-white p-6 lg:block">
        <Link to="/"><Logo size={36} textClassName="text-sm font-bold tracking-[.18em]" /></Link>
        <p className="mt-12 text-[9px] font-bold uppercase tracking-[.18em] text-[#9aa49f]">Doctor workspace</p>
        <div className="mt-3 rounded-xl bg-[#e9f1eb] px-3 py-2.5 text-[10px] font-semibold text-[#285b4c]">Overview</div>
      </aside>
      <main className="lg:ml-64">
        <header className="flex items-center justify-between border-b border-[#e1e7e2] px-5 py-4 md:px-8"><div><p className="text-[10px] text-[#87928c]">Doctor workspace</p><h1 className="mt-1 text-lg font-semibold">Your appointment schedule</h1></div><button onClick={logout} className="text-xs font-semibold text-[#52615a]">Sign out</button></header>
        <div className="px-5 py-7 md:px-8 md:py-9">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] bg-[#173b31] p-7 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a7c5b3]">Today&apos;s practice</p><h2 className="mt-3 text-2xl font-semibold">Your patient visits, in one place.</h2><p className="mt-2 text-xs text-[#c2d4ca]">Open an appointment to review a patient&apos;s history and record their consultation.</p></motion.section>
          <section className="mt-6 grid gap-4 sm:grid-cols-3"><Stat icon={CalendarDays} value={active.length} label="Active appointments" /><Stat icon={Video} value={online} label="Online consultations" /><Stat icon={Users} value={appointments.filter((item) => item.status === "completed").length} label="Completed visits" /></section>
          <section className="mt-7 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white"><div className="border-b border-[#edf0ed] px-6 py-5"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#4c806c]">Appointments</p><h2 className="mt-1 text-lg font-semibold">Your schedule</h2></div>{loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-[#f1f4f1]" />)}</div> : error ? <p className="p-6 text-sm text-[#a06b68]">{error}</p> : appointments.length ? <div className="p-3">{appointments.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} />)}</div> : <div className="p-6"><EmptyState title="No appointments yet" description="New appointments assigned to you will appear here." /></div>}</section>

          <div className="mt-6">
            <LeaveManager leaves={leaves} loading={leavesLoading} onAdd={addLeave} onRemove={removeLeave} />
          </div>
        </div>
      </main>
    </div>
  )
}

function Stat({ icon: Icon, value, label }) { return <div className="rounded-3xl border border-[#e1e7e2] bg-white p-5"><div className="flex justify-between"><div><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-[10px] font-semibold text-[#52615a]">{label}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ee] text-[#4c806c]"><Icon size={15} /></span></div></div> }

function AppointmentRow({ appointment }) {
  const TypeIcon = appointment.type === "online" ? Video : appointment.type === "phone" ? Clock3 : MapPin
  const statusStyle = appointment.status === "completed" ? "bg-[#edf0ee] text-[#69756f]" : "bg-[#e4f1e7] text-[#397051]"
  return <Link to={`/doctor/patient/${appointment._id}`} className="flex items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-[#fafcfa]"><div className="w-20 shrink-0"><p className="text-[10px] font-semibold">{appointment.startTime}</p><p className="mt-1 text-[9px] text-[#a0aaa5]">{formatDate(appointment.date)}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f3ef] text-[#4c806c]"><PawPrint size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{appointment.pet.name}</p><p className="mt-1 truncate text-[9px] text-[#87928c]">{appointment.owner.name} · {appointment.service}</p></div><span className="hidden items-center gap-1 text-[9px] text-[#87928c] sm:flex"><TypeIcon size={11} />{appointment.type}</span><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${statusStyle}`}>{appointment.status}</span><ChevronRight size={13} className="text-[#b1bab5]" /></Link>
}
