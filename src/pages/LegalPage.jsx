import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Logo from "../components/Logo"
import { CLINIC_EMAIL, CLINIC_NAME, CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "../lib/clinicInfo"

const UPDATED = "11 October 2026"

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl font-semibold tracking-tight text-[#17221e]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-[#52615a]">{children}</div>
  </section>
)

const List = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
)

const Contact = () => (
  <p>
    {CLINIC_NAME} · Chennai, Tamil Nadu · Phone:{" "}
    <a href={`tel:${CLINIC_PHONE_TEL}`} className="font-semibold text-[#285b4c] underline">
      {CLINIC_PHONE_DISPLAY}
    </a>{" "}
    · Email:{" "}
    <a href={`mailto:${CLINIC_EMAIL}`} className="font-semibold text-[#285b4c] underline">
      {CLINIC_EMAIL}
    </a>
  </p>
)

function Shell({ title, intro, children }) {
  return (
    <div className="min-h-screen bg-[#f8f7f2] px-5 py-10">
      <main className="mx-auto max-w-3xl rounded-[2rem] bg-white p-7 shadow-xl shadow-[#173b31]/5 sm:p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#52615a]">
          <ArrowLeft size={16} />
          Back to website
        </Link>
        <div className="mt-8">
          <Logo size={44} variant="full" showText={false} />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#17221e]">{title}</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#87928c]">Last updated {UPDATED}</p>
        <p className="mt-6 text-sm leading-7 text-[#52615a]">{intro}</p>
        {children}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-[#e1e6e2] pt-6 text-sm font-semibold text-[#285b4c]">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </main>
    </div>
  )
}

export function PrivacyPolicy() {
  return (
    <Shell
      title="Privacy Policy"
      intro={`This policy explains what personal information Paws & Care, a unit of ${CLINIC_NAME} ("we", "us"), collects through this website, why we collect it and the choices you have.`}
    >
      <Section title="Information we collect">
        <List
          items={[
            "Account details: your name, email address, phone number and a securely hashed password (or your Google account email and name if you sign in with Google).",
            "Pet details: name, species, breed, gender, date of birth, weight, microchip ID, photo and notes you add.",
            "Appointment and medical information: bookings, consultation type, doctor, symptoms, diagnoses, treatments and prescriptions recorded by our veterinarians.",
            "Payment records: amount, status and Razorpay order/payment IDs. We never see or store your card, UPI or bank details — they are handled by Razorpay.",
            "Technical data: a sign-in token stored in your browser so you stay signed in.",
          ]}
        />
      </Section>
      <Section title="How we use it">
        <List
          items={[
            "To create your account, book and manage appointments and keep your pet's health records.",
            "To send appointment confirmations, reminders and password-reset emails.",
            "To create Google Calendar events and Google Meet links for online consultations.",
            "To process payments and keep financial records.",
            "To keep the service secure and prevent misuse.",
          ]}
        />
        <p>We do not sell your personal information and we do not use it for advertising.</p>
      </Section>
      <Section title="Services we share data with">
        <p>We share only what is needed with these providers, who process data on our behalf:</p>
        <List
          items={[
            "Razorpay — payment processing.",
            "Google — sign-in, Calendar/Meet, embedded maps and fonts.",
            "Resend — transactional email delivery.",
            "Our hosting and database providers — to run the website securely.",
          ]}
        />
        <p>We may also disclose information when required by law.</p>
      </Section>
      <Section title="Cookies and browser storage">
        <p>
          We use your browser's local storage to keep you signed in and to remember that you dismissed the cookie notice. These are
          essential to the service. Google and Razorpay may set their own cookies when you use their features; see their policies for
          details. We do not use advertising or analytics cookies.
        </p>
      </Section>
      <Section title="Retention and security">
        <p>
          We keep account and medical records for as long as your account is active or as needed to provide care and meet legal
          obligations. Passwords are hashed, traffic is encrypted in transit and access to records is limited by role (owner, doctor,
          admin). No system is perfectly secure, so please use a strong, unique password.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can view and edit your details and your pets' details in your account. To request a copy, correction or deletion of your
          data, or to withdraw consent, contact us below. We will respond within a reasonable time and in line with applicable Indian
          law, including the Digital Personal Data Protection Act, 2023.
        </p>
      </Section>
      <Section title="Children">
        <p>This website is intended for pet owners aged 18 and over.</p>
      </Section>
      <Section title="Changes">
        <p>We may update this policy. The date above shows the latest revision.</p>
      </Section>
      <Section title="Contact and grievances">
        <Contact />
      </Section>
    </Shell>
  )
}

export function TermsOfService() {
  return (
    <Shell
      title="Terms of Service"
      intro={`By using this website you agree to these terms. The website is operated by Paws & Care, a unit of ${CLINIC_NAME}, Chennai.`}
    >
      <Section title="Using the service">
        <List
          items={[
            "You must provide accurate information and keep your password confidential.",
            "You are responsible for activity under your account.",
            "Do not misuse the website, attempt to access other users' data or interfere with its operation.",
          ]}
        />
      </Section>
      <Section title="Appointments">
        <List
          items={[
            "Bookings are subject to doctor availability and confirmation by the clinic.",
            "Please arrive or join on time. We may reschedule or cancel appointments for clinical or operational reasons and will inform you.",
            "Online and phone consultations are not a substitute for in-person examination where one is clinically needed.",
          ]}
        />
      </Section>
      <Section title="Emergencies">
        <p>
          This website is not for emergencies. If your pet needs urgent care, call the clinic on{" "}
          <a href={`tel:${CLINIC_PHONE_TEL}`} className="font-semibold text-[#285b4c] underline">
            {CLINIC_PHONE_DISPLAY}
          </a>{" "}
          or visit the nearest veterinary hospital immediately.
        </p>
      </Section>
      <Section title="Payments and refunds">
        <p>
          Fees are shown in Indian Rupees at booking. Online payments are processed by Razorpay. Refund requests for cancelled or
          missed consultations are reviewed by the clinic — contact us with your payment details.
        </p>
      </Section>
      <Section title="Medical information">
        <p>
          Information on this website is general and does not replace a veterinarian's judgement. Treatment decisions are made by the
          attending veterinarian during consultation.
        </p>
      </Section>
      <Section title="Intellectual property and attribution">
        <p>
          The Paws & Care name, logo and site content belong to {CLINIC_NAME}. Third-party assets are used under their licences:
          photographs from Unsplash (Unsplash License), icons from Lucide (ISC), animations from LottieFiles, and the Dancing Script
          typeface (SIL Open Font License).
        </p>
      </Section>
      <Section title="Limitation of liability">
        <p>
          The website is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential loss arising
          from your use of the website, or for interruptions beyond our reasonable control.
        </p>
      </Section>
      <Section title="Governing law">
        <p>These terms are governed by the laws of India. Courts in Chennai, Tamil Nadu have jurisdiction.</p>
      </Section>
      <Section title="Contact">
        <Contact />
      </Section>
    </Shell>
  )
}
