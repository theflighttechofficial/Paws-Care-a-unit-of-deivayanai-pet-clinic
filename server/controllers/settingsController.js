import { getConsultationFeePaise, setConsultationFeePaise } from "../db/settings.js"

export const getPublicSettings = async (req, res) => {
  const consultationFeePaise = await getConsultationFeePaise()
  return res.json({ consultationFeePaise })
}

export const updateConsultationFee = async (req, res) => {
  const { amountPaise } = req.body

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    return res.status(400).json({ message: "Amount must be a whole number of at least 100 paise (₹1)." })
  }

  const settings = await setConsultationFeePaise(amountPaise)
  return res.json({ message: "Consultation fee updated.", consultationFeePaise: settings.consultation_fee_paise })
}
