import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, CalendarDays, Plus, Video } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import apiRequest from "../lib/api"
import Logo from "../components/Logo"
import EmptyState from "../components/EmptyState"

const icon = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }
const age = (d) =>
  d
    ? `${Math.max(0, Math.floor((Date.now() - new Date(d)) / 31557600000))} years`
    : "Age not recorded"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiRequest("/pets")
      .then(({ pets }) => setPets(pets))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <header className="flex items-center justify-between">
          <Link to="/">
            <Logo size={32} textClassName="text-sm font-bold tracking-[.17em]" />
          </Link>
          <button onClick={logout} className="text-xs font-semibold text-[#52615a]">
            Sign out
          </button>
        </header>

        <section className="mt-12 flex flex-col justify-between gap-5 rounded-[2rem] bg-[#173b31] p-7 text-white md:flex-row md:items-center">
          <div>
            <p className="text-xs text-[#a9cfba]">Your pet&apos;s care</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user?.name || "there"}.</h1>
            <p className="mt-2 text-sm text-white/60">Your companions and their care, all in one place.</p>
          </div>
          <Link
            to="/booking"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-[#173b31]"
          >
            Book appointment <ArrowRight size={14} />
          </Link>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4c806c]">Your companions</p>
              <h2 className="mt-2 text-2xl font-semibold">My Pets ({pets.length})</h2>
            </div>
            <Link to="/pets" className="text-xs font-semibold text-[#285b4c]">
              Manage pets
            </Link>
          </div>

          {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

          {!loading && pets.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No pets yet"
                description="Add your first companion to start booking appointments and tracking their care."
                action={
                  <Link
                    to="/pets"
                    className="inline-flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white"
                  >
                    <Plus size={14} />
                    Add a pet
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? [1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-[2rem] bg-white" />)
                : pets.map((pet, index) => (
                    <motion.div
                      key={pet._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf3ee] text-3xl">
                          {icon[pet.species]}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold">{pet.name}</h3>
                          <p className="mt-1 text-xs text-[#718079]">{pet.breed || pet.species}</p>
                          <p className="mt-1 text-xs text-[#9aa59f]">{age(pet.dateOfBirth)}</p>
                        </div>
                      </div>
                      <Link
                        to={`/pets/${pet._id}`}
                        className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#285b4c]"
                      >
                        View profile <ArrowRight size={13} />
                      </Link>
                    </motion.div>
                  ))}
              {!loading && (
                <Link
                  to="/pets"
                  className="flex min-h-48 flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#d5dfd8] text-sm font-semibold text-[#52615a]"
                >
                  <Plus className="mb-2 text-[#4c806c]" />
                  Add a pet
                </Link>
              )}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link to="/booking" className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
            <CalendarDays className="text-[#4c806c]" />
            <h2 className="mt-4 font-semibold">Book Appointment</h2>
            <p className="mt-1 text-xs text-[#87928c]">Schedule a visit for one of your pets.</p>
          </Link>
          <Link to="/appointments" className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
            <Video className="text-[#4c806c]" />
            <h2 className="mt-4 font-semibold">Appointments</h2>
            <p className="mt-1 text-xs text-[#87928c]">View your upcoming and past visits.</p>
          </Link>
        </section>
      </main>
    </div>
  )
}
