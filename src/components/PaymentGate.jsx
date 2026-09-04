import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, ChevronLeft, CreditCard, ShieldAlert, ShieldCheck } from "lucide-react"
import apiRequest from "../lib/api"
import ErrorNotice from "./ErrorNotice"

// Gates a phone/online/clinic booking behind a Razorpay payment. For
// online/clinic purposes, bookingDetails carries the pending slot
// selection — the slot itself is only reserved by the backend once
// payment verification succeeds (see paymentController.verifyPayment).
// The checkout.js script is loaded globally in index.html.
export default function PaymentGate({ purpose, bookingDetails, appointmentId, user, title, description, onPaid, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [feePaise, setFeePaise] = useState(null)

  useEffect(() => {
    apiRequest("/settings")
      .then((data) => setFeePaise(data.consultationFeePaise))
      .catch(() => {})
  }, [])

  const feeRupees = feePaise != null ? feePaise / 100 : null

  const startPayment = async () => {
    setError("")

    if (!window.Razorpay) {
      setError("Payment couldn't load. If you have an ad blocker or privacy extension enabled, please turn it off for this site and try again.")
      return
    }

    setLoading(true)
    try {
      const order = await apiRequest("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ purpose, bookingDetails, appointmentId }),
      })

      const razorpay = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Paws & Care",
        description: title,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#173b31" },
        handler: async (response) => {
          try {
            const result = await apiRequest("/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                paymentId: order.paymentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            onPaid(result)
          } catch (err) {
            setError(err.message || "Payment verification failed. Please contact the clinic.")
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })

      razorpay.on("payment.failed", () => {
        setLoading(false)
        setError("Payment failed. Please try again.")
      })

      razorpay.open()
    } catch (err) {
      setError(err.message || "Unable to start payment. Please try again.")
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl text-center"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dcebe1] text-[#285b4c]">
        <CreditCard size={32} />
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">Consultation fee</p>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{title}</h1>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#718079]">{description}</p>

      <div className="mx-auto mt-8 max-w-xs rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
        <p className="text-xs text-[#87928c]">Consultation fee</p>
        <p className="mt-1 text-4xl font-semibold tracking-[-0.04em]">
          {feeRupees != null ? `₹${feeRupees}` : "…"}
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#87928c]">
          <ShieldCheck size={12} />
          Secured by Razorpay
        </p>
      </div>

      <div className="mx-auto mt-5 flex max-w-md items-start gap-2.5 rounded-2xl border border-[#f0e2c0] bg-[#fdf7e9] px-4 py-3 text-left text-xs leading-5 text-[#8a6d2f]">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <p>
          Using an ad blocker or privacy extension? Please turn it off for this site — some
          blockers prevent the Razorpay payment window from loading.
        </p>
      </div>

      {error && <ErrorNotice message={error} className="mx-auto max-w-md" />}

      <button
        onClick={startPayment}
        disabled={loading || feeRupees == null}
        className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full bg-[#173b31] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#285b4c] disabled:opacity-60"
      >
        {loading ? "Opening payment…" : feeRupees != null ? `Pay ₹${feeRupees}` : "Loading…"}
        <ArrowRight size={16} />
      </button>

      <div className="mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-[#718079]"
        >
          <ChevronLeft size={15} />
          Go back
        </button>
      </div>
    </motion.div>
  )
}
