import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import Logo from "../components/Logo"
import { ADMIN_EMAIL } from "../lib/clinicInfo"

// Doubles as both the unknown-route (404) page and the generic "site is
// down / under maintenance" fallback (see ErrorBoundary) — same visual,
// just different copy, so `maintenance` controls which one renders.
export default function NotFound({ maintenance = false }) {
  const title = maintenance ? "Down for a quick nap" : "404"
  const description = maintenance
    ? "We're doing some maintenance right now. Please check back shortly — we'll be up and running again soon."
    : "We couldn't find that page. It may have moved, or the link might be off by a whisker."

  const mailHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    maintenance ? "Paws & Care — site down" : "Paws & Care — broken link"
  )}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : ""}`)}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f2] px-5 py-16 text-center">
      <Logo size={56} variant="full" showText={false} />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 h-56 w-56"
      >
        <DotLottieReact src="/maintenance.lottie" loop autoplay />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#17221e]"
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="mt-3 max-w-sm text-sm leading-6 text-[#78847e]"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        {!maintenance && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#173b31] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        )}

        <a
          href={mailHref}
          className="inline-flex items-center gap-2 rounded-full border border-[#dfe6e1] bg-white px-6 py-3.5 text-sm font-semibold text-[#173b31] transition hover:bg-[#f5f7f5]"
        >
          <Mail size={16} />
          Email admin
        </a>
      </motion.div>
    </div>
  )
}
