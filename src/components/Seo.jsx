import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { SITE_URL } from "../lib/clinicInfo"

const DEFAULT_DESCRIPTION =
  "Paws & Care, a unit of Deivayanai Pet Clinic, Chennai — compassionate veterinary care, online booking and pet health records."
const SOCIAL_IMAGE = `${SITE_URL}/logo.png`

// Public, indexable pages. Everything not listed here (dashboards, admin,
// auth flows, unknown URLs) is served with noindex.
const PUBLIC_META = {
  "/": {
    title: "Paws & Care | Deivayanai Pet Clinic, Chennai",
    description: DEFAULT_DESCRIPTION,
  },
  "/login": {
    title: "Sign in | Paws & Care",
    description: "Sign in to manage your pet's appointments and health records at Paws & Care.",
    noindex: true,
  },
  "/register": {
    title: "Create an account | Paws & Care",
    description: "Create a Paws & Care account to book vet appointments and keep your pet's health records in one place.",
    noindex: true,
  },
  "/privacy": {
    title: "Privacy Policy | Paws & Care",
    description: "How Paws & Care, a unit of Deivayanai Pet Clinic, collects, uses and protects your personal information.",
  },
  "/terms": {
    title: "Terms of Service | Paws & Care",
    description: "The terms that apply when you use the Paws & Care website and book appointments with Deivayanai Pet Clinic.",
  },
  "/about-developer": {
    title: "About the Developer | Paws & Care",
    description: "Meet the developer behind the Paws & Care pet clinic website.",
  },
}

const PRIVATE_TITLES = [
  ["/admin", "Admin | Paws & Care"],
  ["/doctor", "Doctor | Paws & Care"],
  ["/dashboard", "Dashboard | Paws & Care"],
  ["/booking", "Book an appointment | Paws & Care"],
  ["/appointments", "My appointments | Paws & Care"],
  ["/pets", "My pets | Paws & Care"],
  ["/payments", "Payments | Paws & Care"],
  ["/forgot-password", "Forgot password | Paws & Care"],
  ["/reset-password", "Reset password | Paws & Care"],
]

const resolveMeta = (pathname) => {
  if (PUBLIC_META[pathname]) return { ...PUBLIC_META[pathname], known: true }
  const match = PRIVATE_TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (match) return { title: match[1], description: DEFAULT_DESCRIPTION, noindex: true, known: true }
  return { title: "Page not found | Paws & Care", description: DEFAULT_DESCRIPTION, noindex: true, known: false }
}

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", "canonical")
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

// Keeps <title>, description, canonical, Open Graph, Twitter and robots tags
// in sync with the current route. Renders nothing.
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = resolveMeta(pathname)
    const url = meta.known ? `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}` : SITE_URL + "/"

    document.title = meta.title
    setMeta("name", "description", meta.description)
    setMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow")
    setCanonical(url)

    setMeta("property", "og:type", "website")
    setMeta("property", "og:site_name", "Paws & Care")
    setMeta("property", "og:title", meta.title)
    setMeta("property", "og:description", meta.description)
    setMeta("property", "og:url", url)
    setMeta("property", "og:image", SOCIAL_IMAGE)
    setMeta("name", "twitter:card", "summary")
    setMeta("name", "twitter:title", meta.title)
    setMeta("name", "twitter:description", meta.description)
    setMeta("name", "twitter:image", SOCIAL_IMAGE)
  }, [pathname])

  return null
}
