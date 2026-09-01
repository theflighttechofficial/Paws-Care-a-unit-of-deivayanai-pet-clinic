import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CreditCard } from "lucide-react"
import { Link } from "react-router-dom"
import apiRequest from "../lib/api"
import { useAuth } from "../context/AuthContext"
import Logo from "../components/Logo"
import EmptyState from "../components/EmptyState"

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
    apiRequest("/payments/mine")
      .then((response) => setPayments(response.payments || []))
      .catch((requestError) => setError(requestError.message || "Unable to load your payment history."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <header className="border-b border-[#e1e6e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/dashboard">
            <Logo size={40} />
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-xs font-semibold text-[#52615a]">
              Back to dashboard
            </Link>
            <button onClick={logout} className="text-xs font-semibold text-[#52615a]">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Payment history</h1>
          <p className="mt-2 text-sm text-[#718079]">Receipts for every consultation you've paid for.</p>
        </motion.div>

        {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {!loading && payments.length === 0 && (
          <div className="mt-8">
            <EmptyState title="No payments yet" description="Receipts for paid consultations will show up here." />
          </div>
        )}

        {!loading && payments.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
            {payments.map((payment, index) => (
              <div
                key={payment.id}
                className={`flex flex-wrap items-center justify-between gap-4 px-6 py-5 ${index !== payments.length - 1 ? "border-b border-[#edf0ed]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ef] text-[#285b4c]">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{payment.service || "Consultation"}</p>
                    <p className="mt-1 text-[10px] text-[#87928c]">
                      {payment.petName ? `${payment.petName} · ` : ""}
                      {formatDate(payment.date || payment.createdAt)} · {methodLabel[payment.method] || payment.method}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">₹{payment.amount}</span>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${statusStyle[payment.status] || "bg-[#f3f5f3] text-[#87928c]"}`}>
                    {payment.status === "paid" ? "Paid" : payment.status === "created" ? "Pending" : "Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
