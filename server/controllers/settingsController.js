import {
  getBookingSchedule,
  getOnlineConsultationFeePaise,
  getPhoneConsultationFeePaise,
  setBookingSchedule,
  setOnlineConsultationFeePaise,
  setPhoneConsultationFeePaise,
} from "../db/settings.js"

export const getPublicSettings = async (req, res) => {
  const [onlineConsultationFeePaise, phoneConsultationFeePaise, bookingSchedule] = await Promise.all([
    getOnlineConsultationFeePaise(),
    getPhoneConsultationFeePaise(),
    getBookingSchedule(),
  ])
  return res.json({ onlineConsultationFeePaise, phoneConsultationFeePaise, bookingSchedule })
}

const validateFeeAmount = (amountPaise) => Number.isInteger(amountPaise) && amountPaise >= 100

export const updateOnlineConsultationFee = async (req, res) => {
  const { amountPaise } = req.body

  if (!validateFeeAmount(amountPaise)) {
    return res.status(400).json({ message: "Amount must be a whole number of at least 100 paise (₹1)." })
  }

  const settings = await setOnlineConsultationFeePaise(amountPaise)
  return res.json({ message: "Online consultation fee updated.", onlineConsultationFeePaise: settings.online_consultation_fee_paise })
}

export const updatePhoneConsultationFee = async (req, res) => {
  const { amountPaise } = req.body

  if (!validateFeeAmount(amountPaise)) {
    return res.status(400).json({ message: "Amount must be a whole number of at least 100 paise (₹1)." })
  }

  const settings = await setPhoneConsultationFeePaise(amountPaise)
  return res.json({ message: "Phone consultation fee updated.", phoneConsultationFeePaise: settings.phone_consultation_fee_paise })
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
