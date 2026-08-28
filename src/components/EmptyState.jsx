import { motion } from "framer-motion"
import { PawPrint } from "lucide-react"

// Reusable animated empty state. Drop into any list/table page:
// {!loading && items.length === 0 && <EmptyState title="..." description="..." />}
export default function EmptyState({
  icon: Icon = PawPrint,
  title = "Nothing here yet",
  description = "",
  action = null,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#dde5e0] bg-[#fbfcfb] px-6 py-16 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#e2eee6] text-[#285b4c]"
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[#4c806c]/20"
        />
        <Icon size={26} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-5 text-base font-semibold text-[#17221e]"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="mt-2 max-w-sm text-sm leading-6 text-[#78847e]"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.4 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}
