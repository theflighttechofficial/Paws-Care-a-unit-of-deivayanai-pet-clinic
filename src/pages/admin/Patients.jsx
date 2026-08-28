import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import Logo from "../../components/Logo"
import EmptyState from "../../components/EmptyState"

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

export default function Patients() {
  const { logout } = useAuth()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiRequest("/admin/patients")
      .then((data) => setPets(data.pets || []))
      .catch((requestError) => setError(requestError.message || "Unable to load patients."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Clinic records</p>
              <h1 className="mt-1 text-xl font-semibold">Patients</h1>
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Every companion on file</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Patients ({pets.length})</h2>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f] md:grid">
              <span>Pet</span>
              <span>Species / breed</span>
              <span>Owner</span>
              <span>Contact</span>
            </div>

            {loading && (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f1f4f1]" />
                ))}
              </div>
            )}

            {!loading && pets.length === 0 && (
              <EmptyState title="No patients on record" description="Pets registered by owners will show up here." />
            )}

            {!loading &&
              pets.map((pet) => (
                <div
                  key={pet._id}
                  className="grid gap-3 border-b border-[#edf0ed] px-6 py-4 text-sm last:border-0 md:grid-cols-[1fr_1fr_1fr_1fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3ef] text-lg">
                      {petEmoji[pet.species] || "🐾"}
                    </span>
                    <span className="font-semibold">{pet.name}</span>
                  </div>
                  <span className="text-xs text-[#718079]">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</span>
                  <span className="text-xs text-[#718079]">{pet.owner?.full_name || "Unknown owner"}</span>
                  <span className="truncate text-xs text-[#718079]">{pet.owner?.email}</span>
                </div>
              ))}
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
        <AdminNav to="/admin/patients" label="🐾  Patients" active />
        <AdminNav to="/admin/doctors" label="🩺  Doctors" />
        <AdminNav to="/admin/services" label="✚  Services" />
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
