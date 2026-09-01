import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Star } from "lucide-react"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={14} className={star <= value ? "fill-[#eab308] text-[#eab308]" : "text-[#dfe6e1]"} />
      ))}
    </div>
  )
}

export default function Feedback() {
  const { logout } = useAuth()
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiRequest("/admin/ratings")
      .then((response) => setRatings(response.ratings || []))
      .catch((requestError) => setError(requestError.message || "Unable to load feedback."))
      .finally(() => setLoading(false))
  }, [])

  const average = useMemo(() => {
    if (ratings.length === 0) return null
    return (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
  }, [ratings])

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="feedback" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Owner responses</p>
              <h1 className="mt-1 text-xl font-semibold">Feedback</h1>
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
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Booking experience ratings</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Feedback ({ratings.length})</h2>
            </div>

            {average && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#e1e7e2] bg-white px-5 py-3">
                <span className="text-2xl font-semibold">{average}</span>
                <Stars value={Math.round(Number(average))} />
                <span className="text-xs text-[#87928c]">avg. of {ratings.length}</span>
              </div>
            )}
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {loading && (
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-[#f1f4f1]" />
              ))}
            </div>
          )}

          {!loading && ratings.length === 0 && (
            <div className="mt-8">
              <EmptyState title="No feedback yet" description="Ratings owners leave after booking will show up here." />
            </div>
          )}

          {!loading && ratings.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
              {ratings.map((rating, index) => (
                <div
                  key={rating.id}
                  className={`px-6 py-5 ${index !== ratings.length - 1 ? "border-b border-[#edf0ed]" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{rating.ownerName || "Owner"}</p>
                      <p className="mt-1 text-[10px] text-[#87928c]">
                        {rating.service} · {rating.petName} · {formatDate(rating.createdAt)}
                      </p>
                    </div>
                    <Stars value={rating.rating} />
                  </div>

                  {rating.feedback && (
                    <p className="mt-3 rounded-xl bg-[#f6f8f6] p-3 text-xs leading-5 text-[#52615a]">{rating.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
