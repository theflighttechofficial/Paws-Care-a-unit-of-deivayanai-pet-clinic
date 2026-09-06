import { getBookingSchedule, getConsultationFeePaise, setBookingSchedule, setConsultationFeePaise } from "../db/settings.js"

export const getPublicSettings = async (req, res) => {
  const [consultationFeePaise, bookingSchedule] = await Promise.all([getConsultationFeePaise(), getBookingSchedule()])
  return res.json({ consultationFeePaise, bookingSchedule })
}

export const updateConsultationFee = async (req, res) => {
  const { amountPaise } = req.body

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    return res.status(400).json({ message: "Amount must be a whole number of at least 100 paise (₹1)." })
  }

  const settings = await setConsultationFeePaise(amountPaise)
  return res.json({ message: "Consultation fee updated.", consultationFeePaise: settings.consultation_fee_paise })
}

const isValidSession = (session) =>
  session &&
  Number.isInteger(session.startHour) &&
  Number.isInteger(session.endHour) &&
  session.startHour >= 0 &&
  session.startHour <= 23 &&
  session.endHour >= 1 &&
  session.endHour <= 24 &&
  session.startHour < session.endHour

const isValidSessionList = (sessions) => Array.isArray(sessions) && sessions.length > 0 && sessions.every(isValidSession)

export const updateBookingSchedule = async (req, res) => {
  const { slotIntervalMinutes, weekdaySessions, sundaySessions } = req.body

  if (![15, 20, 30, 45, 60].includes(slotIntervalMinutes)) {
    return res.status(400).json({ message: "Slot interval must be one of 15, 20, 30, 45, or 60 minutes." })
  }

  if (!isValidSessionList(weekdaySessions) || !isValidSessionList(sundaySessions)) {
    return res.status(400).json({ message: "Each session needs a valid start and end hour (0-24), with start before end." })
  }

  const settings = await setBookingSchedule({ slotIntervalMinutes, weekdaySessions, sundaySessions })
  return res.json({ message: "Booking schedule updated.", bookingSchedule: settings.booking_schedule })
}
