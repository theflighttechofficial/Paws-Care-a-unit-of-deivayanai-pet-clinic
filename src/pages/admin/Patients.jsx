import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Trash2 } from "lucide-react"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"
import SendEmailModal from "../../components/SendEmailModal"

const petEmoji = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }

export default function Patients() {
  const { logout } = useAuth()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState(null)
  const [emailTarget, setEmailTarget] = useState(null)
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    apiRequest("/admin/patients")
      .then((data) => setPets(data.pets || []))
      .catch((requestError) => setError(requestError.message || "Unable to load patients."))
      .finally(() => setLoading(false))
  }, [])

  const deletePatient = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}'s record? This can't be undone.`)) return

    setDeletingId(id)
    setError("")
    try {
      await apiRequest(`/admin/patients/${id}`, { method: "DELETE" })
      setPets((current) => current.filter((pet) => pet._id !== id))
    } catch (requestError) {
      setError(requestError.message || "Unable to delete patient.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="patients" />

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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Every companion on file</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Patients ({pets.length})</h2>
            </div>

            <button
              onClick={() => setComposing(true)}
              className="flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#285b4c]"
            >
              <Mail size={13} />
              Compose email
            </button>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f] md:grid">
              <span>Pet</span>
              <span>Species / breed</span>
              <span>Owner</span>
              <span>Contact</span>
              <span>Actions</span>
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
                  className="grid gap-3 border-b border-[#edf0ed] px-6 py-4 text-sm last:border-0 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center"
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

                  <div className="flex items-center gap-2">
                    {pet.owner?.email && (
                      <button
                        onClick={() => setEmailTarget(pet)}
                        title={`Email ${pet.owner.full_name || "owner"}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe6e1] text-[#52615a] transition hover:bg-[#f5f7f5]"
                      >
                        <Mail size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => deletePatient(pet._id, pet.name)}
                      disabled={deletingId === pet._id}
                      title="Delete this patient record"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {emailTarget && (
        <SendEmailModal
          defaultTo={emailTarget.owner?.email || ""}
          defaultToLabel={`${emailTarget.owner?.full_name || "owner"} (about ${emailTarget.name})`}
          onClose={() => setEmailTarget(null)}
        />
      )}

      {composing && <SendEmailModal onClose={() => setComposing(false)} />}
    </div>
  )
}
