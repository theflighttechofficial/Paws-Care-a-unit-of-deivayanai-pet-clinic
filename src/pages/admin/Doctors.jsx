import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"
import LeaveManager from "../../components/LeaveManager"

export default function Doctors() {
  const { logout } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [leaves, setLeaves] = useState([])
  const [leavesLoading, setLeavesLoading] = useState(true)

  useEffect(() => {
    apiRequest("/appointments/doctors")
      .then((data) => setDoctors(data.doctors || []))
      .catch((requestError) => setError(requestError.message || "Unable to load doctors."))
      .finally(() => setLoading(false))
  }, [])

  const loadLeaves = () => {
    setLeavesLoading(true)
    apiRequest("/leaves")
      .then((data) => setLeaves(data.leaves || []))
      .catch(() => setLeaves([]))
      .finally(() => setLeavesLoading(false))
  }

  useEffect(() => {
    loadLeaves()
  }, [])

  const addLeave = async (date, reason, doctorId) => {
    await apiRequest("/leaves", { method: "POST", body: JSON.stringify({ doctorId, date, reason }) })
    loadLeaves()
  }

  const removeLeave = async (leave) => {
    await apiRequest(`/leaves/${leave.id}`, { method: "DELETE" })
    loadLeaves()
  }

  const doctorOptions = doctors.map((doctor) => ({ id: doctor._id || doctor.id, name: doctor.name }))

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="doctors" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Clinic staff</p>
              <h1 className="mt-1 text-xl font-semibold">Doctors</h1>
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Team</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Veterinarians on staff</h2>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading &&
              [1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-[2rem] bg-white" />)}

            {!loading && doctors.length === 0 && (
              <div className="md:col-span-3">
                <EmptyState title="No doctors on record" description="Doctor profiles you add will appear here." />
              </div>
            )}

            {!loading &&
              doctors.map((doctor) => (
                <div key={doctor._id || doctor.id} className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcebe1] text-sm font-semibold text-[#285b4c]">
                      {doctor.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{doctor.name}</h3>
                      <p className="mt-1 truncate text-xs text-[#87928c]">{doctor.specialty}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-xs text-[#718079]">
                    <p>{doctor.experience}</p>
                    {doctor.email && <p className="truncate">{doctor.email}</p>}
                  </div>

                  {doctor.bio && <p className="mt-4 text-xs leading-5 text-[#87928c]">{doctor.bio}</p>}
                </div>
              ))}
          </div>

          {!loading && doctors.length > 0 && (
            <div className="mt-8">
              <LeaveManager
                leaves={leaves}
                loading={leavesLoading}
                onAdd={addLeave}
                onRemove={removeLeave}
                doctorOptions={doctorOptions}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
