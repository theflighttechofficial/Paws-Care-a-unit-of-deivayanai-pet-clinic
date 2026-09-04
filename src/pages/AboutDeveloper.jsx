import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Logo from "../components/Logo"

// lucide-react dropped all brand/social icons (Github, Linkedin, Instagram,
// etc.) as of the installed v1 — plain inline SVGs stand in for those three.
const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.421-.012 2.751 0 .269.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 01-.001 4.124zM7.114 20.452H3.559V9h3.555v11.452z" />
  </svg>
)

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const links = [
  { label: "GitHub", href: "https://github.com/theflighttechofficial", icon: GithubIcon },
  { label: "Kaggle", href: "https://kaggle.com/theflighttechofficial", icon: BarChart3 },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/varun-vaibhav-s-11b69a2ba/", icon: LinkedinIcon },
  { label: "Instagram", href: "https://www.instagram.com/Varunwashere__", icon: InstagramIcon },
]

const stack = [
  "React + Tailwind CSS frontend",
  "Node.js + Express backend",
  "PostgreSQL database",
  "Google Calendar-integrated appointment booking",
  "Razorpay payments",
]

export default function AboutDeveloper() {
  return (
    <div className="min-h-screen bg-[#f8f7f2] px-5 py-8 text-[#17221e]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo size={36} />
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-[#52615a]">
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 overflow-hidden rounded-[2.5rem] border border-[#e1e7e2] bg-white p-8 shadow-sm md:p-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">About the developer</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">S. Varun Vaibhav</h1>

          <p className="mt-2 text-sm font-semibold text-[#87928c]">The Flight Tech Labs</p>

          <p className="mt-6 max-w-xl text-sm leading-7 text-[#52615a]">
            This website was designed and built by S. Varun Vaibhav, working under the brand{" "}
            <span className="font-semibold text-[#285b4c]">The Flight Tech Labs</span>.
          </p>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#52615a]">
            Varun built the full stack for this project — end to end:
          </p>

          <ul className="mt-4 space-y-2">
            {stack.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#52615a]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4c806c]" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-xl text-sm leading-7 text-[#52615a]">
            He has hands-on experience across AI, data engineering, and full-stack development, including a Data
            Analyst internship at L&amp;T Construction's Analytics Department, and has built several other
            production systems spanning computer vision (road damage detection), RAG pipelines, and civic tech.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {links.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#e1e7e2] bg-[#fbfcfb] px-4 py-5 text-center transition hover:-translate-y-0.5 hover:border-[#9ab5a5]"
              >
                <Icon width={20} height={20} className="text-[#285b4c]" />
                <span className="text-xs font-semibold text-[#52615a]">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
