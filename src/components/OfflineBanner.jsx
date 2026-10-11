import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

// Shown while the browser reports no network connection so failed requests
// are not mistaken for a broken site.
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-[#17221e] px-4 py-2.5 text-sm font-medium text-white"
    >
      <WifiOff size={16} />
      You're offline. Check your internet connection — changes won't be saved until you're back online.
    </div>
  )
}
