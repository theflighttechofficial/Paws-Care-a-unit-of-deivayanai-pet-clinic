import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Heart,
  Menu,
  Phone,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Video,
  X,
} from "lucide-react"
import { useAuth } from "./context/AuthContext"
import Logo from "./components/Logo"
import { CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "./lib/clinicInfo"

const roleHomeMap = { owner: "/dashboard", doctor: "/doctor", admin: "/admin" }

const services = [
  {
    icon: Stethoscope,
    title: "General Care",
    description:
      "Routine consultations, health checks and personalised care for your pet.",
  },
  {
    icon: Syringe,
    title: "Vaccinations",
    description:
      "Keep your companion protected with timely vaccinations and preventive care.",
  },
  {
    icon: Heart,
    title: "Dental Care",
    description:
      "Professional dental examinations and treatments for healthier smiles.",
  },
  {
    icon: ShieldCheck,
    title: "Diagnostics",
    description:
      "Modern diagnostic support to help us understand what your pet needs.",
  },
]

const doctors = [
  {
    name: "M. Subramanian",
    role: "Veterinarian",
    experience: "20+ years experience",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function App() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (isAuthenticated()) {
      navigate(roleHomeMap[user.role] || "/dashboard", { replace: true })
    }
  }, [loading, user, isAuthenticated, navigate])

  if (loading || isAuthenticated()) {
    return <div className="min-h-screen bg-[#f8f7f2]" />
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f7f2] text-[#17221e]">
      {/* NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 md:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/75 px-5 py-3 shadow-[0_10px_40px_rgba(24,43,35,0.07)] backdrop-blur-xl">
          <a href="#">
            <Logo size={36} />
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#doctors">Doctors</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/about-developer"
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#52615a] transition hover:bg-[#eef3ee]"
            >
              Developer
            </Link>

            <Link
              to="/login"
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#173b31] transition hover:bg-[#eef3ee]"
            >
              Sign In
            </Link>

            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285b4c]"
            >
              Book Appointment
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="rounded-full p-2 md:hidden"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-2 rounded-3xl border border-white/60 bg-white/95 p-5 shadow-xl backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-5">
              <MobileLink
                href="#home"
                onClick={() => setMobileMenu(false)}
              >
                Home
              </MobileLink>
              <MobileLink
                href="#services"
                onClick={() => setMobileMenu(false)}
              >
                Services
              </MobileLink>
              <MobileLink
                href="#doctors"
                onClick={() => setMobileMenu(false)}
              >
                Doctors
              </MobileLink>
              <MobileLink
                href="#about"
                onClick={() => setMobileMenu(false)}
              >
                About
              </MobileLink>
              <MobileLink
                href="#contact"
                onClick={() => setMobileMenu(false)}
              >
                Contact
              </MobileLink>

              <Link
                to="/about-developer"
                className="rounded-full border border-[#dfe6e1] px-5 py-3 text-center text-sm font-semibold text-[#52615a]"
                onClick={() => setMobileMenu(false)}
              >
                Developer
              </Link>

              <Link
                to="/login"
                className="rounded-full border border-[#dfe6e1] px-5 py-3 text-center text-sm font-semibold text-[#173b31]"
                onClick={() => setMobileMenu(false)}
              >
                Sign In
              </Link>

              <Link
                to="/login"
                className="rounded-full bg-[#173b31] px-5 py-3 text-center text-sm font-semibold text-white"
                onClick={() => setMobileMenu(false)}
              >
                Book Appointment
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* HERO */}
      <main id="home">
        <section className="relative min-h-screen px-5 pb-20 pt-32 md:px-8 md:pt-40">
          <div className="pointer-events-none absolute left-[-150px] top-[15%] h-[400px] w-[400px] rounded-full bg-[#cde5d7]/50 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="relative z-10"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#bdd7c8] bg-[#eaf3ed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#285b4c]">
                <span className="h-2 w-2 rounded-full bg-[#4c8b70]" />
                Compassionate veterinary care
              </div>

              <h1 className="max-w-3xl text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.91] tracking-[-0.065em]">
                Their health.
                <br />
                <span className="text-[#4c806c]">Our commitment.</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-[#5c6963] md:text-xl">
                Thoughtful veterinary care for every stage of your pet's
                journey, from their first visit to their golden years.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group flex items-center justify-center gap-3 rounded-full bg-[#173b31] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#173b31]/15 transition duration-300 hover:-translate-y-1 hover:bg-[#285b4c]"
                >
                  Get Started
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-3 rounded-full border border-[#d4dcd7] bg-white/70 px-7 py-4 text-sm font-semibold transition hover:-translate-y-1 hover:bg-white"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap gap-8 border-t border-[#dfe5e0] pt-7">
                <Stat value="5K+" label="Pets cared for" />
                <Stat value="4.9/5" label="Pet owner rating" />
                <Stat value="20+" label="Years of care" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -right-5 -top-5 z-10 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-xl backdrop-blur-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5f0e8] text-[#285b4c]">
                  <Heart size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#173b31]">
                    Trusted care
                  </p>
                  <p className="text-[11px] text-[#718079]">
                    Every visit matters
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[3rem] bg-[#dceae1]">
                <img
                  src="https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=90"
                  alt="Happy dog"
                  className="h-[520px] w-full object-cover object-center md:h-[650px]"
                />

                <div className="absolute inset-x-5 bottom-5 rounded-[1.75rem] border border-white/40 bg-[#173b31]/85 p-5 text-white backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/60">
                        Your next visit
                      </p>
                      <p className="mt-1 font-medium">
                        Care made simple.
                      </p>
                    </div>

                    <CalendarDays size={22} className="text-white/70" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-6 hidden rounded-3xl border border-white bg-white p-4 shadow-2xl md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e8d4]">
                    🐾
                  </div>
                  <div>
                    <p className="text-xs font-semibold">5,000+</p>
                    <p className="text-[11px] text-[#718079]">
                      happy companions
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SERVICES */}
        <section
          id="services"
          className="bg-white px-5 py-24 md:px-8 md:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                  What we do
                </p>

                <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
                  Everything your pet needs,
                  <span className="text-[#7b8a83]"> under one roof.</span>
                </h2>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.title}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="px-5 py-24 md:px-8 md:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1200&q=90"
                  alt="Pet owner with dog"
                  className="h-[500px] w-full rounded-[3rem] object-cover md:h-[650px]"
                />

                <div className="absolute bottom-6 right-6 rounded-3xl bg-white p-5 shadow-2xl">
                  <p className="text-3xl font-semibold">20+</p>
                  <p className="mt-1 text-xs text-[#718079]">
                    years caring for pets
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                  Why choose us
                </p>

                <h2 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-6xl">
                  Care that goes beyond
                  <span className="text-[#4c806c]"> the consultation.</span>
                </h2>

                <p className="mt-7 max-w-xl text-lg leading-8 text-[#65716b]">
                  We believe great veterinary care is about more than
                  treating illness. It is about understanding your pet,
                  building trust and giving you confidence every step of
                  the way.
                </p>

                <div className="mt-9 space-y-4">
                  <Feature text="Experienced veterinary professionals" />
                  <Feature text="Modern diagnostic and treatment facilities" />
                  <Feature text="Personalised care for every pet" />
                  <Feature text="Online consultations from home" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CONSULTATION */}
        <section
          id="consultation"
          className="px-5 py-10 md:px-8 md:py-16"
        >
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-[#173b31] px-7 py-16 text-white md:px-16 md:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Reveal>
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Video size={22} />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a9cfba]">
                    Online consultations
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] md:text-6xl">
                    Can't make it to the clinic?
                  </h2>

                  <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
                    Connect with your veterinarian from home through a
                    secure video consultation. Simple booking, calendar
                    integration and Google Meet in one place.
                  </p>

                  <Link
                    to="/register"
                    className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#173b31] transition hover:-translate-y-1"
                  >
                    Book online consultation
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </Reveal>

              <Reveal>
                <div className="relative mx-auto w-full max-w-md">
                  <div className="rounded-[2.5rem] bg-white/10 p-3 backdrop-blur">
                    <div className="overflow-hidden rounded-[2rem] bg-[#e8eee9]">
                      <div className="flex items-center justify-between bg-white px-5 py-4">
                        <div>
                          <p className="text-xs font-semibold text-[#173b31]">
                            Online consultation
                          </p>
                          <p className="text-[10px] text-[#7a8881]">
                            M. Subramanian
                          </p>
                        </div>

                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#4c806c]">
                          <span className="h-2 w-2 rounded-full bg-[#4c806c]" />
                          Connected
                        </span>
                      </div>

                      <div className="relative h-72 overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=85"
                          alt="Veterinarian with dog"
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute bottom-4 left-4 rounded-xl bg-black/40 px-3 py-2 text-xs text-white backdrop-blur">
                          Bruno
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 bg-white p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f3f0]">
                          <Phone size={16} />
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f3f0]">
                          <Video size={16} />
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                          <X size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* DOCTORS */}
        <section
          id="doctors"
          className="bg-white px-5 py-24 md:px-8 md:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                    Our team
                  </p>

                  <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
                    Meet the vet
                    <br />
                    <span className="text-[#7b8a83]">
                      behind the care.
                    </span>
                  </h2>
                </div>

                <a
                  href="#doctors"
                  className="group flex items-center gap-2 text-sm font-semibold"
                >
                  Get in touch
                  <ChevronRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>
              </div>
            </Reveal>

            <div className="mt-14 grid max-w-sm gap-5">
              {doctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.name}
                  doctor={doctor}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                  Simple from start to finish
                </p>

                <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
                  Care shouldn't be complicated.
                </h2>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              <Step
                number="01"
                icon={CalendarDays}
                title="Book"
                text="Choose your pet, service, doctor and a time that works for you."
              />

              <Step
                number="02"
                icon={Clock3}
                title="Meet"
                text="Visit the clinic or join your veterinarian online through Google Meet."
              />

              <Step
                number="03"
                icon={Heart}
                title="Care"
                text="Get personalised veterinary care and keep everything organised in one place."
              />
            </div>
          </div>
        </section>

        {/* BOOKING CTA */}
        <section
          id="booking"
          className="px-5 pb-24 md:px-8 md:pb-32"
        >
          <Reveal>
            <div className="mx-auto max-w-7xl rounded-[3rem] bg-[#e5efe8] px-7 py-16 text-center md:px-20">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                Ready when you are
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
                Give your pet the care they deserve.
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-[#68766f]">
                Create a free account to book an appointment with our
                veterinary team today.
              </p>

              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#173b31] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#173b31]/15 transition duration-300 hover:-translate-y-1 hover:bg-[#285b4c]"
              >
                Get Started
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        id="contact"
        className="bg-[#173b31] px-5 py-16 text-white md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo
                size={36}
                dark
                subClassName="block text-[9px] tracking-wide text-white/50"
              />

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                Compassionate veterinary care for every member of your
                family.
              </p>
            </div>

            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                Explore
              </p>

              <div className="space-y-3 text-sm text-white/70">
                <a href="#services" className="block hover:text-white">
                  Services
                </a>
                <a href="#doctors" className="block hover:text-white">
                  Doctors
                </a>
                <a href="#about" className="block hover:text-white">
                  About
                </a>
                <a href="#booking" className="block hover:text-white">
                  Appointments
                </a>
              </div>
            </div>

            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                Contact
              </p>

              <div className="space-y-3 text-sm text-white/70">
                <p>📍 Chennai, Tamil Nadu</p>
                <p>📞 {CLINIC_PHONE_DISPLAY}</p>
                <p>✉ subbu76_vet@yahoo.com</p>
                <p>Mon – Sat · 9:00 AM – 10:00 PM</p>
                <p>Sun · 8:00 AM – 5:00 PM</p>
                <p className="space-x-3 pt-1">
                  <a
                    href="https://maps.app.goo.gl/2n6Ze17uj5HFaSsTA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    Deivayanai Pet Clinic - Porur
                  </a>
                  <a
                    href="https://maps.app.goo.gl/9yd8aomwYUjz8X7u9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    Deivayanai Pet Clinic - Iyyapanthangal
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Find us
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <p className="bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80">
                  Deivayanai Pet Clinic — Porur
                </p>
                <iframe
                  title="Deivayanai Pet Clinic - Porur location"
                  src="https://www.google.com/maps?q=Deivayanai+Pet+Clinic+Porur+Chennai&output=embed"
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <p className="bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80">
                  Deivayanai Pet Clinic — Iyyapanthangal
                </p>
                <iframe
                  title="Deivayanai Pet Clinic - Iyyapanthangal location"
                  src="https://www.google.com/maps?q=Deivayanai+Pet+Clinic+Iyyapanthangal+Chennai&output=embed"
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
            © 2026 Paws & Care, a unit of Deivayanai Pet Clinic. All rights
            reserved.
          </div>
        </div>
      </footer>

      {/* EMERGENCY BUTTON */}
      <a
        href={`tel:${CLINIC_PHONE_TEL}`}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-white/50 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Phone size={14} />
        </div>

        <div className="hidden sm:block">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
            Emergency?
          </p>
          <p className="text-xs font-semibold">Call the clinic</p>
        </div>
      </a>
    </div>
  )
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-sm text-[#52615a] transition hover:text-[#173b31]"
    >
      {children}
    </a>
  )
}

function MobileLink({ href, children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm font-medium text-[#52615a]"
    >
      {children}
    </a>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[#78847e]">{label}</p>
    </div>
  )
}

function Reveal({ children }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  )
}

function ServiceCard({ service, index }) {
  const Icon = service.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
      }}
      whileHover={{ y: -6 }}
      className="group rounded-[2rem] border border-[#e4e9e5] bg-[#f8faf8] p-7 transition-shadow hover:shadow-xl hover:shadow-[#173b31]/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2eee6] text-[#285b4c] transition group-hover:bg-[#173b31] group-hover:text-white">
        <Icon size={21} />
      </div>

      <h3 className="mt-7 text-xl font-semibold tracking-tight">
        {service.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#718079]">
        {service.description}
      </p>

      <div className="mt-7 flex items-center gap-1 text-xs font-semibold text-[#285b4c]">
        Explore service
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </motion.div>
  )
}

function DoctorCard({ doctor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
      }}
      className="group"
    >
      <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[#e5eee8]">
        <span className="text-[9rem] font-semibold leading-none text-[#173b31]/15">
          S
        </span>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-white/85 p-4 backdrop-blur-xl">
          <h3 className="font-semibold">{doctor.name}</h3>
          <p className="mt-1 text-xs text-[#718079]">{doctor.role}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs text-[#718079]">{doctor.experience}</p>

        <Link to="/register" className="text-xs font-semibold text-[#285b4c]">
          View profile →
        </Link>
      </div>
    </motion.div>
  )
}

function Feature({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dfece4] text-[#285b4c]">
        ✓
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}

function Step({ number, icon: Icon, title, text }) {
  return (
    <Reveal>
      <div className="rounded-[2rem] border border-[#e1e7e2] bg-white p-7">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.15em] text-[#9aa59f]">
            {number}
          </span>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f0e9] text-[#285b4c]">
            <Icon size={19} />
          </div>
        </div>

        <h3 className="mt-12 text-2xl font-semibold">{title}</h3>

        <p className="mt-3 text-sm leading-6 text-[#718079]">{text}</p>
      </div>
    </Reveal>
  )
}

export default App
