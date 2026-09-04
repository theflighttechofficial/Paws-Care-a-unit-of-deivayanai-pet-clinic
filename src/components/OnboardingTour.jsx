import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CalendarDays, CreditCard, LogIn, PawPrint, X } from "lucide-react"

const STORAGE_PREFIX = "pawscare_onboarded_"

// Has this user ever finished (or skipped) the tour before? Scoped per
// user id so multiple accounts on the same browser each get their own
// first-time walkthrough, and it never shows again once dismissed.
export const hasSeenOnboarding = (userId) => {
  if (!userId) return true
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}`) === "true"
  } catch {
    return true
  }
}

const markOnboardingSeen = (userId) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "true")
  } catch {
    // localStorage unavailable — the tour will just show again next visit.
  }
}

const steps = [
  {
    icon: LogIn,
    eyebrow: "Step 1",
    title: "You're signed in",
    description: "This is your dashboard — your pets, appointments and payments all live here.",
  },
  {
    icon: PawPrint,
    eyebrow: "Step 2",
    title: "Add your pet",
    description: "Add a profile for each companion so we know who an appointment is for.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Step 3",
    title: "Book an appointment",
    description: "Pick a service, a vet, and a time that works — in person, online, or by phone.",
  },
  {
    icon: CreditCard,
    eyebrow: "Step 4",
    title: "Pay to confirm",
    description: "Slots are reserved once payment goes through — quick and secured by Razorpay.",
  },
]

export default function OnboardingTour({ userId, onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const Icon = step.icon

  const finish = () => {
    markOnboardingSeen(userId)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1611]/60 px-5"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-7 shadow-2xl"
        >
          <button
            onClick={finish}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#9aa59f] transition hover:bg-[#f1f4f1]"
          >
            <X size={16} />
          </button>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
            <Icon size={24} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">{step.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{step.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#718079]">{step.description}</p>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === stepIndex ? "w-5 bg-[#173b31]" : "w-1.5 bg-[#dfe6e1]"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {!isLast && (
                <button onClick={finish} className="text-xs font-semibold text-[#87928c]">
                  Skip
                </button>
              )}

              <button
                onClick={() => (isLast ? finish() : setStepIndex((current) => current + 1))}
                className="flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#285b4c]"
              >
                {isLast ? "Get started" : "Next"}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
