import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Compass } from "lucide-react"
import Logo from "../components/Logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f2] px-5 py-16 text-center">
      <Logo size={56} variant="full" showText={false} />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#e2eee6] text-[#285b4c]"
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[#4c806c]/20"
        />
        <Compass size={38} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-8 text-5xl font-semibold tracking-[-0.05em] text-[#17221e]"
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="mt-3 max-w-sm text-sm leading-6 text-[#78847e]"
      >
        We couldn't find that page. It may have moved, or the link might be
        off by a whisker.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#173b31] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </motion.div>
    </div>
  )
}
