import { CalendarDays, Heart, PawPrint, Phone, Scissors, ShieldCheck, Stethoscope, Syringe } from "lucide-react"

export const SERVICE_ICONS = {
  stethoscope: Stethoscope,
  heart: Heart,
  pawprint: PawPrint,
  calendar: CalendarDays,
  scissors: Scissors,
  syringe: Syringe,
  shield: ShieldCheck,
  phone: Phone,
}

export const getServiceIcon = (key) => SERVICE_ICONS[key] || Stethoscope
