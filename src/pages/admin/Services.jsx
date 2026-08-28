import { Link } from "react-router-dom"
import { CalendarDays, Heart, PawPrint, Stethoscope } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import Logo from "../../components/Logo"

const services = [
  { id: "general", title: "General Consultation", description: "Routine checkups, symptoms and general health concerns.", duration: "30 min", price: "₹600", icon: Stethoscope },
  { id: "vaccination", title: "Vaccination", description: "Essential vaccinations and preventive care.", duration: "20 min", price: "₹450", icon: Heart },
  { id: "dental", title: "Dental Care", description: "Dental examination, cleaning and oral health.", duration: "30 min", price: "₹800", icon: PawPrint },
  { id: "followup", title: "Follow-up", description: "Review an existing condition or previous consultation.", duration: "20 min", price: "₹400", icon: CalendarDays },
]

export default function Services() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Clinic catalog</p>
              <h1 className="mt-1 text-xl font-semibold">Services</h1>
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

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Offered to owners at booking</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Services</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#718079]">
              These are the services owners can choose from in Step 2 of the booking flow.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.id} className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-6 font-semibold">{service.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#87928c]">{service.description}</p>
                  <div className="mt-4 flex gap-3 text-[10px] text-[#718079]">
                    <span>{service.duration}</span>
                    <span>•</span>
                    <span>Est. {service.price}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
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
        <AdminNav to="/admin/services" label="✚  Services" active />
        <AdminNav to="/admin/settings" label="⚙  Settings" />
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
