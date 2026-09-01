import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  MapPin,
  Phone,
  Star,
  Video,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import apiRequest from "../lib/api"
import { buildGoogleCalendarLink } from "../lib/googleCalendarLink"
import Logo from "../components/Logo"
import EmptyState from "../components/EmptyState"
import PaymentGate from "../components/PaymentGate"
import { CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "../lib/clinicInfo"
import { getServiceIcon } from "../lib/serviceIcons"

/* Legacy mock pet data intentionally disabled: choices load from /api/pets. */
/*
const unusedLegacyPets = [
  {
    id: 1,
    name: "Bruno",
    breed: "Golden Retriever",
    age: "3 years",
    emoji: "🐕",
  },
  {
    id: 2,
    name: "Luna",
    breed: "Persian",
    age: "2 years",
    emoji: "🐈",
  },
]
*/

const SLOT_INTERVAL_MINUTES = 15
const MORNING_SESSION = { startHour: 9, endHour: 13 }
const EVENING_SESSION = { startHour: 16, endHour: 22 }

const formatSlotLabel = (hour, minute) => {
  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`
}

const buildSession = ({ startHour, endHour }) => {
  const slots = []
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += SLOT_INTERVAL_MINUTES) {
    slots.push(formatSlotLabel(Math.floor(minutes / 60), minutes % 60))
  }
  return slots
}

// Mon–Sat: 9:00 AM–1:00 PM and 4:00 PM–10:00 PM. Sundays: mornings only.
const getTimeSlotsForDate = (date) =>
  date?.day === "Sun" ? buildSession(MORNING_SESSION) : [...buildSession(MORNING_SESSION), ...buildSession(EVENING_SESSION)]

const consultationTypes = [
  {
    id: "clinic",
    title: "Visit Clinic",
    description: "Bring your pet to the clinic.",
    icon: MapPin,
  },
  {
    id: "online",
    title: "Online Consultation",
    description: "Talk to a vet through Google Meet.",
    icon: Video,
  },
  {
    id: "phone",
    title: "Phone Consultation",
    description: "Speak directly with the clinic — no slot needed, just call.",
    icon: Phone,
  },
]

export default function Booking() {
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()

  const [step, setStep] = useState(1)

  const [selectedPet, setSelectedPet] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [pets, setPets] = useState([])
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [doctorsError, setDoctorsError] = useState("")
  const [bookingError, setBookingError] = useState("")
  const [bookedTimes, setBookedTimes] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [doctorOnLeave, setDoctorOnLeave] = useState(false)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState("")

  const isPhoneConsultation = selectedType?.id === "phone"
  const isSurgery = selectedService?.phoneOnly

  useEffect(() => {
    if (authLoading || !user?.id) {
      return
    }

    apiRequest("/pets")
      .then((response) => setPets(response.pets || []))
      .catch((error) => {
        console.error("Failed to load pets for booking:", { message: error.message, userId: user?.id })
        setBookingError("Unable to load your pets. Please try again.")
      })

    apiRequest("/appointments/doctors")
      .then((response) => setAvailableDoctors(response.doctors || []))
      .catch((error) => {
        console.error("Failed to load doctors for booking:", { message: error.message, userId: user?.id })
        setDoctorsError("Unable to load veterinarians. Please try again.")
      })
      .finally(() => setDoctorsLoading(false))
  }, [authLoading, user?.id])

  useEffect(() => {
    apiRequest("/services")
      .then((response) => setServices(response.services || []))
      .catch((error) => setServicesError(error.message || "Unable to load services."))
      .finally(() => setServicesLoading(false))
  }, [])

  useEffect(() => {
    const doctorId = selectedDoctor?._id || selectedDoctor?.id
    if (!doctorId || !selectedDate) {
      setBookedTimes([])
      return
    }

    const dateParam = selectedDate.value.slice(0, 10)
    setSlotsLoading(true)
    apiRequest(`/appointments/booked-slots?doctorId=${doctorId}&date=${dateParam}`)
      .then((response) => {
        setBookedTimes(response.bookedTimes || [])
        setDoctorOnLeave(Boolean(response.onLeave))
      })
      .catch(() => {
        setBookedTimes([])
        setDoctorOnLeave(false)
      })
      .finally(() => setSlotsLoading(false))
  }, [selectedDoctor, selectedDate])

  useEffect(() => {
    if (selectedTime && bookedTimes.includes(selectedTime)) {
      setSelectedTime(null)
    }
  }, [bookedTimes, selectedTime])

  const dates = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index)

      return {
        value: date.toISOString(),
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        number: date.getDate(),
        month: date.toLocaleDateString("en-US", {
          month: "short",
        }),
      }
    })
  }, [])

  const canContinue = () => {
    if (step === 1) return selectedPet
    if (step === 2) return selectedService
    if (step === 3) return selectedType
    if (step === 4) return selectedDoctor
    if (step === 5) return selectedDate && selectedTime && !doctorOnLeave

    return true
  }

  const nextStep = () => {
    if (!canContinue()) return

    if (step === 2 && isSurgery) {
      setStep("phone")
      return
    }

    if (step === 3 && isPhoneConsultation) {
      setStep("phone-payment")
      return
    }

    setStep((current) => current + 1)
  }

  const previousStep = () => {
    if (step === "phone") {
      setStep(isSurgery ? 2 : "phone-payment")
      return
    }

    if (step === "phone-payment") {
      setStep(3)
      return
    }

    setStep((current) => Math.max(1, current - 1))
  }

  const [bookedAppointment, setBookedAppointment] = useState(null)

  const confirmBooking = async () => {
    setBookingError("")
    try {
      const response = await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          petId: selectedPet._id,
          doctorId: selectedDoctor._id,
          service: selectedService.title,
          type: selectedType.id,
          date: selectedDate.value,
          startTime: selectedTime,
          endTime: selectedTime,
        }),
      })

      setBookedAppointment(response.appointment)
      if (response.googleCalendarStatus) {
        localStorage.setItem("lastGoogleCalendarStatus", response.googleCalendarStatus)
      }

      setStep(selectedType.id === "online" ? "online-payment" : 7)
    } catch (error) {
      setBookingError(error.message || "Unable to book the appointment.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <header className="border-b border-[#e1e6e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/">
            <Logo size={40} />
          </Link>

          <div className="flex items-center gap-5">
            <Link
              to="/dashboard"
              className="hidden text-xs font-semibold text-[#52615a] sm:block"
            >
              Back to dashboard
            </Link>

            <button
              onClick={logout}
              className="text-xs font-semibold text-[#52615a]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        {step < 7 && (
          <>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
                Appointment
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                Book a visit for your pet
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#718079]">
                Choose a service, veterinarian and convenient time.
                We'll take care of the rest.
              </p>
            </div>

            <Progress step={step} />

            {bookingError && (
              <p className="mx-auto mt-6 max-w-4xl rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {bookingError}
              </p>
            )}

            <div className="mx-auto mt-10 max-w-4xl">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <StepContainer key="pet">
                    <StepTitle
                      eyebrow="Step 1"
                      title="Who is this appointment for?"
                      description="Select one of your pets."
                    />

                    {pets.length === 0 ? (
                      <div className="mt-8">
                        <EmptyState
                          title="No pets on file yet"
                          description="Add a pet profile first so we know who this appointment is for."
                          action={
                            <Link
                              to="/pets"
                              className="inline-flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white"
                            >
                              Add a pet
                              <ArrowRight size={13} />
                            </Link>
                          }
                        />
                      </div>
                    ) : (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {pets.map((pet) => (
                        <SelectionCard
                          key={pet._id}
                          selected={selectedPet?._id === pet._id}
                          onClick={() => setSelectedPet(pet)}
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ee] text-3xl">
                            {{ Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", Other: "🐾" }[pet.species]}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {pet.name}
                            </h3>

                            <p className="mt-1 text-xs text-[#87928c]">
                              {pet.breed} · {pet.age}
                            </p>
                          </div>

                          <SelectionIndicator
                            selected={selectedPet?._id === pet._id}
                          />
                        </SelectionCard>
                      ))}
                    </div>
                    )}

                    <Link
                      to="/pets"
                      className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#4c806c]"
                    >
                      Manage your pets
                      <ArrowRight size={13} />
                    </Link>
                  </StepContainer>
                )}

                {step === 2 && (
                  <StepContainer key="service">
                    <StepTitle
                      eyebrow="Step 2"
                      title="What does your pet need?"
                      description="Choose the service that best matches your visit."
                    />

                    {servicesError && (
                      <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{servicesError}</p>
                    )}

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      {servicesLoading &&
                        [1, 2, 3, 4].map((item) => (
                          <div key={item} className="h-32 animate-pulse rounded-[1.75rem] bg-[#f1f4f1]" />
                        ))}

                      {!servicesLoading &&
                        services.map((service) => {
                          const Icon = getServiceIcon(service.icon)

                          return (
                            <SelectionCard
                              key={service.id}
                              selected={
                                selectedService?.id === service.id
                              }
                              onClick={() =>
                                setSelectedService(service)
                              }
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
                                <Icon size={19} />
                              </div>

                              <div className="flex-1">
                                <h3 className="font-semibold">
                                  {service.title}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-[#87928c]">
                                  {service.description}
                                </p>

                                {service.phoneOnly ? (
                                  <p className="mt-3 text-[10px] font-semibold text-[#4c806c]">
                                    We'll skip the slot picker — you'll call {CLINIC_PHONE_DISPLAY} directly
                                  </p>
                                ) : (
                                  <div className="mt-3 flex gap-3 text-[10px] text-[#718079]">
                                    <span>{service.duration} min</span>
                                    <span>•</span>
                                    <span>Est. ₹{service.price}</span>
                                  </div>
                                )}
                              </div>

                              <SelectionIndicator
                                selected={
                                  selectedService?.id === service.id
                                }
                              />
                            </SelectionCard>
                          )
                        })}
                    </div>
                  </StepContainer>
                )}

                {step === 3 && (
                  <StepContainer key="type">
                    <StepTitle
                      eyebrow="Step 3"
                      title="How would you like to consult?"
                      description="Choose what works best for you and your pet."
                    />

                    <div className="mt-8 space-y-4">
                      {consultationTypes.map((type) => {
                        const Icon = type.icon

                        return (
                          <SelectionCard
                            key={type.id}
                            selected={selectedType?.id === type.id}
                            onClick={() => setSelectedType(type)}
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
                              <Icon size={21} />
                            </div>

                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {type.title}
                              </h3>

                              <p className="mt-1 text-xs text-[#87928c]">
                                {type.description}
                              </p>

                              {type.id === "online" && (
                                <p className="mt-3 text-[10px] font-semibold text-[#4c806c]">
                                  Call {CLINIC_PHONE_DISPLAY} first to confirm, then we'll share the Google Meet link
                                </p>
                              )}

                              {type.id === "phone" && (
                                <p className="mt-3 text-[10px] font-semibold text-[#4c806c]">
                                  We'll skip the slot picker — you'll call {CLINIC_PHONE_DISPLAY} directly
                                </p>
                              )}
                            </div>

                            <SelectionIndicator
                              selected={selectedType?.id === type.id}
                            />
                          </SelectionCard>
                        )
                      })}
                    </div>
                  </StepContainer>
                )}

                {step === 4 && (
                  <StepContainer key="doctor">
                    <StepTitle
                      eyebrow="Step 4"
                      title="Choose your veterinarian"
                      description="Select the doctor you'd like to consult."
                    />

                    <div className="mt-8 space-y-4">
                      {doctorsLoading && (
                        <p className="rounded-2xl border border-dashed border-[#d4ded7] p-6 text-center text-sm text-[#718079]">
                          Loading veterinarians...
                        </p>
                      )}

                      {!doctorsLoading && doctorsError && (
                        <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">
                          {doctorsError}
                        </p>
                      )}

                      {!doctorsLoading && !doctorsError && availableDoctors.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-[#d4ded7] p-6 text-center text-sm text-[#718079]">
                          No veterinarians are currently available.
                        </p>
                      )}

                      {!doctorsLoading && !doctorsError && availableDoctors.map((doctor) => (
                        <SelectionCard
                          key={doctor._id || doctor.id}
                          selected={
                            (selectedDoctor?._id || selectedDoctor?.id) === (doctor._id || doctor.id)
                          }
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcebe1] text-sm font-semibold text-[#285b4c]">
                            {doctor.initials || doctor.name?.split(" ").filter((part) => !part.startsWith("Dr.")).map((part) => part[0]).join("")}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {doctor.name}
                            </h3>

                            <p className="mt-1 text-xs text-[#87928c]">
                              {doctor.specialty}
                            </p>

                            <p className="mt-2 text-[10px] text-[#a0aaa5]">
                              {doctor.experience}
                            </p>
                          </div>

                          <SelectionIndicator
                            selected={
                              (selectedDoctor?._id || selectedDoctor?.id) === (doctor._id || doctor.id)
                            }
                          />
                        </SelectionCard>
                      ))}
                    </div>
                  </StepContainer>
                )}

                {step === 5 && (
                  <StepContainer key="schedule">
                    <StepTitle
                      eyebrow="Step 5"
                      title="Find a convenient time"
                      description="Choose a date and available appointment slot."
                    />

                    <div className="mt-8">
                      <p className="text-xs font-semibold text-[#52615a]">
                        Select date
                      </p>

                      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {dates.map((date) => (
                          <button
                            key={date.value}
                            onClick={() => {
                              setSelectedDate(date)
                              setSelectedTime(null)
                            }}
                            className={`rounded-2xl border p-3 text-center transition ${
                              selectedDate?.value === date.value
                                ? "border-[#173b31] bg-[#173b31] text-white"
                                : "border-[#dfe6e1] bg-white hover:border-[#8aaa99]"
                            }`}
                          >
                            <span className="block text-[10px] opacity-60">
                              {date.day}
                            </span>

                            <span className="mt-1 block text-lg font-semibold">
                              {date.number}
                            </span>

                            <span className="mt-1 block text-[9px] opacity-60">
                              {date.month}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#52615a]">
                            Available times
                          </p>

                          <span className="text-[10px] text-[#87928c]">
                            {selectedDoctor.name}
                          </span>
                        </div>

                        {selectedDate.day === "Sun" && (
                          <p className="mt-2 text-[10px] text-[#a0aaa5]">
                            Sundays: morning hours only (9:00 AM – 1:00 PM).
                          </p>
                        )}

                        {!slotsLoading && doctorOnLeave ? (
                          <div className="mt-4 rounded-2xl border border-dashed border-[#e7c9c5] bg-[#faf2f1] p-5 text-center">
                            <p className="text-sm font-semibold text-[#a06b68]">
                              {selectedDoctor.name} is on leave this day
                            </p>
                            <p className="mt-1 text-xs text-[#87928c]">
                              Please choose another date to see available times.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {getTimeSlotsForDate(selectedDate).map((time) => {
                                const isBooked = bookedTimes.includes(time)

                                return (
                                  <button
                                    key={time}
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(time)}
                                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-semibold transition ${
                                      isBooked
                                        ? "cursor-not-allowed border-[#e9ede9] bg-[#f3f5f3] text-[#b7c0ba] line-through"
                                        : selectedTime === time
                                          ? "border-[#173b31] bg-[#173b31] text-white"
                                          : "border-[#dfe6e1] bg-white hover:border-[#8aaa99]"
                                    }`}
                                  >
                                    <Clock3 size={13} />
                                    {time}
                                  </button>
                                )
                              })}
                            </div>

                            {slotsLoading && (
                              <p className="mt-3 text-[10px] text-[#a0aaa5]">Checking availability…</p>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#edf4ef] p-5 text-center sm:flex-row sm:text-left">
                      <div>
                        <p className="text-xs font-semibold text-[#285b4c]">Not sure which time works?</p>
                        <p className="mt-1 text-[11px] text-[#52615a]">Call the clinic and we'll help you find a slot.</p>
                      </div>

                      <a
                        href={`tel:${CLINIC_PHONE_TEL}`}
                        className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#173b31] shadow-sm"
                      >
                        <Phone size={13} />
                        {CLINIC_PHONE_DISPLAY}
                      </a>
                    </div>
                  </StepContainer>
                )}

                {step === 6 && (
                  <StepContainer key="review">
                    <StepTitle
                      eyebrow="Almost there"
                      title="Review your appointment"
                      description="Make sure everything looks right before confirming."
                    />

                    <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white">
                      <ReviewRow
                        label="Pet"
                        value={`${selectedPet.name} · ${selectedPet.breed}`}
                        onEdit={() => setStep(1)}
                      />

                      <ReviewRow
                        label="Service"
                        value={selectedService.title}
                        onEdit={() => setStep(2)}
                      />

                      <ReviewRow
                        label="Consultation"
                        value={selectedType.title}
                        onEdit={() => setStep(3)}
                      />

                      <ReviewRow
                        label="Veterinarian"
                        value={selectedDoctor.name}
                        onEdit={() => setStep(4)}
                      />

                      <ReviewRow
                        label="Date"
                        value={`${selectedDate.day}, ${selectedDate.month} ${selectedDate.number}`}
                        onEdit={() => setStep(5)}
                      />

                      <ReviewRow
                        label="Time"
                        value={selectedTime}
                        onEdit={() => setStep(5)}
                        last
                      />
                    </div>

                    <div className="mt-6 rounded-2xl bg-[#edf4ef] p-5">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#285b4c]">
                          <Check size={16} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold">
                            You're all set
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-[#718079]">
                            {selectedType.id === "online"
                              ? "A Google Meet link will be generated for your online consultation."
                              : "You'll receive confirmation details after booking."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </StepContainer>
                )}
              </AnimatePresence>

              {step < 7 && (
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={previousStep}
                    disabled={step === 1}
                    className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-[#718079] disabled:invisible"
                  >
                    <ChevronLeft size={15} />
                    Back
                  </button>

                  {step < 6 ? (
                    <button
                      onClick={nextStep}
                      disabled={!canContinue()}
                      className="flex items-center gap-2 rounded-full bg-[#173b31] px-6 py-3.5 text-xs font-semibold text-white transition hover:bg-[#285b4c] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={confirmBooking}
                      className="flex items-center gap-2 rounded-full bg-[#173b31] px-7 py-3.5 text-xs font-semibold text-white transition hover:bg-[#285b4c]"
                    >
                      Confirm Appointment
                      <Check size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {step === "phone-payment" && (
          <PaymentGate
            purpose="phone_consultation"
            user={user}
            title="Pay to get the clinic's number"
            description="Phone consultations start with a quick ₹200 fee — once paid, we'll show you the number to call."
            onPaid={() => setStep("phone")}
            onBack={previousStep}
          />
        )}

        {step === "phone" && (
          <PhoneCallScreen
            pet={selectedPet}
            isSurgery={isSurgery}
            onBack={previousStep}
            onDashboard={() => navigate("/dashboard")}
          />
        )}

        {step === "online-payment" && (
          <PaymentGate
            purpose="online_consultation"
            appointmentId={bookedAppointment?._id || bookedAppointment?.id}
            user={user}
            title="Pay to confirm your online consultation"
            description="Your slot is booked. Pay the ₹200 consultation fee to get the call-to-confirm number and your Google Meet link."
            onPaid={() => setStep(7)}
            onBack={() => navigate("/dashboard")}
          />
        )}

        {step === 7 && (
          <SuccessScreen
            pet={selectedPet}
            service={selectedService}
            doctor={selectedDoctor}
            type={selectedType}
            date={selectedDate}
            time={selectedTime}
            appointment={bookedAppointment}
            onDashboard={() => navigate("/dashboard")}
            googleStatus={localStorage.getItem("lastGoogleCalendarStatus") || "Google Calendar integration is not configured."}
          />
        )}
      </main>
    </div>
  )
}

function StepContainer({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="rounded-[2.5rem] border border-[#e1e7e2] bg-white p-6 shadow-sm md:p-10"
    >
      {children}
    </motion.div>
  )
}

function StepTitle({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>

      <p className="mt-2 text-sm text-[#87928c]">
        {description}
      </p>
    </div>
  )
}

function SelectionCard({
  children,
  selected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-3xl border p-5 text-left transition ${
        selected
          ? "border-[#173b31] bg-[#f1f6f2] shadow-sm"
          : "border-[#e1e7e2] bg-white hover:-translate-y-0.5 hover:border-[#9ab5a5]"
      }`}
    >
      {children}
    </button>
  )
}

function SelectionIndicator({ selected }) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        selected
          ? "border-[#173b31] bg-[#173b31] text-white"
          : "border-[#cbd5cf]"
      }`}
    >
      {selected && <Check size={13} />}
    </div>
  )
}

function Progress({ step }) {
  const labels = [
    "Pet",
    "Service",
    "Type",
    "Doctor",
    "Schedule",
    "Review",
  ]

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="flex items-center justify-between">
        {labels.map((label, index) => {
          const number = index + 1
          const active = step >= number

          return (
            <div
              key={label}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-[#173b31] text-white"
                      : "bg-[#e7ece8] text-[#87928c]"
                  }`}
                >
                  {active && step > number ? (
                    <Check size={12} />
                  ) : (
                    number
                  )}
                </div>

                <span
                  className={`mt-2 hidden text-[9px] sm:block ${
                    active
                      ? "font-semibold text-[#285b4c]"
                      : "text-[#9aa59f]"
                  }`}
                >
                  {label}
                </span>
              </div>

              {number < labels.length && (
                <div
                  className={`mx-2 mt-[-18px] h-px flex-1 ${
                    step > number
                      ? "bg-[#4c806c]"
                      : "bg-[#dfe6e1]"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
  last,
}) {
  return (
    <div
      className={`flex items-center gap-5 px-6 py-5 md:px-8 ${
        !last ? "border-b border-[#edf0ed]" : ""
      }`}
    >
      <div className="w-28 shrink-0 text-xs text-[#87928c]">
        {label}
      </div>

      <p className="flex-1 text-sm font-semibold">
        {value}
      </p>

      <button
        onClick={onEdit}
        className="text-[10px] font-semibold text-[#4c806c]"
      >
        Edit
      </button>
    </div>
  )
}

function PhoneCallScreen({ pet, isSurgery, onBack, onDashboard }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl text-center"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dcebe1] text-[#285b4c]">
        <Phone size={32} />
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
        {isSurgery ? "Surgery consultation" : "Phone consultation"}
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
        Call us to book {pet ? `for ${pet.name}` : "your appointment"}
      </h1>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#718079]">
        {isSurgery
          ? "Surgical procedures need a phone consultation before scheduling — call the clinic directly and we'll take it from there."
          : "Phone consultations aren't scheduled through a time slot — call the clinic directly and we'll take it from there."}
      </p>

      <a
        href={`tel:${CLINIC_PHONE_TEL}`}
        className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-[#173b31] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#285b4c]"
      >
        <Phone size={18} />
        {CLINIC_PHONE_DISPLAY}
      </a>

      <p className="mt-4 text-xs text-[#87928c]">
        Mon – Sat · 9:00 AM – 10:00 PM · Sun · 8:00 AM – 5:00 PM
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-[#718079]"
        >
          <ChevronLeft size={15} />
          Choose a different option
        </button>

        <button
          onClick={onDashboard}
          className="rounded-full border border-[#dfe6e1] px-5 py-3 text-xs font-semibold text-[#173b31]"
        >
          Go to Dashboard
        </button>
      </div>
    </motion.div>
  )
}

function SuccessScreen({
  pet,
  service,
  doctor,
  type,
  date,
  time,
  appointment,
  onDashboard,
  googleStatus,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl text-center"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dcebe1] text-[#285b4c]">
        <Check size={32} />
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#4c806c]">
        Appointment confirmed
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
        {pet.name} is booked! 🐾
      </h1>

      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#718079]">
        Your appointment has been successfully scheduled. We've
        saved the details below for you.
      </p>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#e1e7e2] bg-white text-left">
        <div className="border-b border-[#edf0ed] bg-[#fafbfa] px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87928c]">
            Appointment details
          </p>
        </div>

        <ReviewRow
          label="Pet"
          value={`${pet.name} · ${pet.breed}`}
        />

        <ReviewRow
          label="Service"
          value={service.title}
        />

        <ReviewRow
          label="Veterinarian"
          value={doctor.name}
        />

        <ReviewRow
          label="Date"
          value={`${date.day}, ${date.month} ${date.number}`}
        />

        <ReviewRow
          label="Time"
          value={time}
        />

        <ReviewRow
          label="Type"
          value={type.title}
          last
        />
      </div>

      {type.id === "online" && (
        <div className="mt-5 rounded-2xl bg-[#edf4ef] p-5 text-left">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-[#285b4c]" />

            <div>
              <p className="text-xs font-semibold">Step 1 — call to confirm</p>
              <p className="mt-1 text-[10px] text-[#718079]">
                Call {CLINIC_PHONE_DISPLAY} to confirm your online consultation before your slot.
              </p>
            </div>
          </div>

          <a
            href={`tel:${CLINIC_PHONE_TEL}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#173b31] px-5 py-3 text-xs font-semibold text-white"
          >
            <Phone size={13} />
            {CLINIC_PHONE_DISPLAY}
          </a>

          <div className="mt-4 flex items-center gap-3 border-t border-[#dbe7dd] pt-4">
            <Video size={18} className="text-[#285b4c]" />

            <div>
              <p className="text-xs font-semibold">Step 2 — join Google Meet</p>
              <p className="mt-1 text-[10px] text-[#718079]">
                {googleStatus || "Google Calendar integration is not configured."}
              </p>
            </div>
          </div>
        </div>
      )}

      {type.id === "clinic" && (
        <div className="mt-5 rounded-2xl bg-[#edf4ef] p-5 text-left">
          <div className="flex items-center gap-3">
            <Video size={18} className="text-[#285b4c]" />

            <div>
              <p className="text-xs font-semibold">Calendar sync status</p>
              <p className="mt-1 text-[10px] text-[#718079]">
                {googleStatus || "Google Calendar integration is not configured."}
              </p>
            </div>
          </div>
        </div>
      )}

      {appointment && (
        <a
          href={buildGoogleCalendarLink(appointment)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-full border border-[#dfe6e1] bg-white px-5 py-3 text-xs font-semibold text-[#173b31] transition hover:bg-[#f5f7f5]"
        >
          <CalendarDays size={14} />
          Add to my Google Calendar
        </a>
      )}

      {appointment && <RatingPrompt appointmentId={appointment._id || appointment.id} />}

      <button
        onClick={onDashboard}
        className="mt-4 rounded-full bg-[#173b31] px-7 py-3.5 text-xs font-semibold text-white"
      >
        Go to Dashboard
      </button>
    </motion.div>
  )
}

function RatingPrompt({ appointmentId }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!rating) return
    setSubmitting(true)
    setError("")
    try {
      await apiRequest(`/appointments/${appointmentId}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || "Unable to submit your rating.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-5 rounded-2xl bg-[#edf4ef] p-6 text-left">
        <p className="text-sm font-semibold text-[#173b31]">Thanks for the feedback! 🎉</p>
        <p className="mt-1 text-xs text-[#718079]">It helps us keep improving your booking experience.</p>
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#e1e7e2] bg-white p-6 text-left">
      <p className="text-sm font-semibold">How was your booking experience?</p>
      <p className="mt-1 text-xs text-[#87928c]">Rate it before you go — it only takes a second.</p>

      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${value} out of 5`}
            className="p-0.5"
          >
            <Star
              size={26}
              className={(hoverRating || rating) >= value ? "fill-[#eab308] text-[#eab308]" : "text-[#d5dfd8]"}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Anything you'd like to tell us? (optional)"
          className="mt-4 min-h-20 w-full rounded-xl border border-[#dfe6e1] p-3 text-sm outline-none focus:border-[#4c806c]"
        />
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="mt-4 rounded-full bg-[#173b31] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  )
}
