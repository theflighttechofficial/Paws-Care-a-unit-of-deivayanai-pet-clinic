import { motion } from "framer-motion"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

// Full-screen loader shown briefly while a page opens.
export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f8f7f2]"
    >
      <div className="h-48 w-48">
        <DotLottieReact src="/cute-doggie.lottie" loop autoplay />
      </div>
    </motion.div>
  )
}
