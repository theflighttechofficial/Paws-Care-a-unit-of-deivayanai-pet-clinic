import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CreditCard } from "lucide-react"
import apiRequest from "../../lib/api"
import { useAuth } from "../../context/AuthContext"
import EmptyState from "../../components/EmptyState"
import AdminSidebar from "../../components/AdminSidebar"

const statusStyle = {
  paid: "bg-[#e6f1e9] text-[#285b4c]",
  created: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
}

const methodLabel = { razorpay: "Online", cash: "Cash", card: "Card", upi: "UPI", other: "Other" }

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"

export default function Payments() {
  const { logout } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiRequest("/admin/payments")
      .then((response) => setPayments(response.payments || []))
      .catch((requestError) => setError(requestError.message || "Unable to load payments."))
      .finally(() => setLoading(false))
  }, [])

  const totalCollected = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="payments" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Billing ledger</p>
              <h1 className="mt-1 text-xl font-semibold">Payments</h1>
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
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Every recorded payment</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Payments ({payments.length})</h2>
              <p className="mt-2 text-sm text-[#718079]">
                Online payments capture automatically. To record cash/card/UPI collected at the clinic, use "Mark as paid" on the appointment in Appointments.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e2] bg-white px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#87928c]">Total collected</p>
              <p className="mt-1 text-2xl font-semibold">₹{totalCollected}</p>
            </div>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {loading && (
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f1f4f1]" />
              ))}
            </div>
          )}

          {!loading && payments.length === 0 && (
            <div className="mt-8">
              <EmptyState title="No payments yet" description="Payments will show up here once owners start paying for consultations." />
            </div>
          )}

          {!loading && payments.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
              <div className="hidden grid-cols-[1fr_1fr_1fr_100px_110px] gap-4 border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f] md:grid">
                <span>Owner</span>
                <span>Service</span>
                <span>Date</span>
                <span>Method</span>
                <span>Amount</span>
              </div>

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid gap-3 border-b border-[#edf0ed] px-6 py-4 text-sm last:border-0 md:grid-cols-[1fr_1fr_1fr_100px_110px] md:items-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3ef] text-[#285b4c]">
                      <CreditCard size={13} />
                    </span>
                    <span className="font-medium">{payment.ownerName || "Owner"}</span>
                  </div>
                  <span className="text-xs text-[#718079]">{payment.service || "—"}</span>
                  <span className="text-xs text-[#718079]">{formatDate(payment.date || payment.createdAt)}</span>
                  <span className="text-xs text-[#718079]">{methodLabel[payment.method] || payment.method}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">₹{payment.amount}</span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${statusStyle[payment.status] || "bg-[#f3f5f3] text-[#87928c]"}`}>
                      {payment.status === "paid" ? "Paid" : payment.status === "created" ? "Pending" : "Failed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
