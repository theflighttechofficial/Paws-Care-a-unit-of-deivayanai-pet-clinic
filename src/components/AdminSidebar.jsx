import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import Logo from "./Logo"

const NAV_ITEMS = [
  { key: "overview", to: "/admin", label: "⌂  Overview" },
  { key: "appointments", to: "/admin/appointments", label: "📅  Appointments" },
  { key: "patients", to: "/admin/patients", label: "🐾  Patients" },
  { key: "doctors", to: "/admin/doctors", label: "🩺  Doctors" },
  { key: "services", to: "/admin/services", label: "✚  Services" },
  { key: "settings", to: "/admin/settings", label: "⚙  Settings" },
]

// Shared admin nav: a fixed sidebar from `lg` up, and — since that sidebar
// is hidden below `lg` — a floating menu button + slide-in drawer on
// mobile/tablet so every admin page stays reachable on smaller screens.
export default function AdminSidebar({ active }) {
  const [open, setOpen] = useState(false)

  const links = (onNavigate) => (
    <nav className="mt-3 space-y-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          onClick={onNavigate}
          className={`block rounded-xl px-4 py-3 text-sm font-medium ${
            active === item.key ? "bg-[#e7f0e9] text-[#285b4c]" : "text-[#718079] hover:bg-[#f5f7f5]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-0 hidden w-64 border-r border-[#e1e6e2] bg-white px-5 py-7 lg:block">
        <Link to="/" className="px-3">
          <Logo
            size={36}
            textClassName="block text-sm font-bold tracking-[0.17em]"
            subClassName="block text-[9px] tracking-wide text-[#87928c]"
          />
        </Link>

        <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0aaa5]">Clinic</p>

        {links()}
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#173b31] text-white shadow-xl lg:hidden"
      >
        <Menu size={19} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          <div className="absolute bottom-0 left-0 top-0 w-72 max-w-[80vw] overflow-y-auto bg-white px-5 py-7 shadow-2xl">
            <div className="flex items-center justify-between px-3">
              <Logo size={32} textClassName="block text-sm font-bold tracking-[0.17em]" showText={false} />

              <button
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f4f1] text-[#718079]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0aaa5]">Clinic</p>

            {links(() => setOpen(false))}
          </div>
        </div>
      )}
    </>
  )
}
