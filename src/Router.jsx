import { Navigate, Outlet, Route, Routes } from "react-router-dom"

import { useAuth } from "./context/AuthContext"
import App from "./App"
import Booking from "./pages/Booking"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import NotFound from "./pages/NotFound"
import Dashboard from "./pages/Dashboard"
import Pets from "./pages/Pets"
import PetProfile from "./pages/PetProfile"

import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminAppointments from "./pages/admin/Appointments"
import AdminDoctors from "./pages/admin/Doctors"
import AdminPatients from "./pages/admin/Patients"
import AdminServices from "./pages/admin/Services"
import AdminSettings from "./pages/admin/Settings"

import DoctorDashboard from "./pages/Doctor/DoctorDashboard"
import PatientVisit from "./pages/Doctor/PatientVisit"
import Appointments from "./pages/Appointments"

const roleHomeMap = {
  owner: "/dashboard",
  doctor: "/doctor",
  admin: "/admin",
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-[#f8f7f2]" />
  }

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomeMap[user.role] || "/login"} replace />
  }

  return children ? children : <Outlet />
}

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
        <Route path="/booking" element={<Booking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pets" element={<Pets />} />
        <Route path="/pets/:id" element={<PetProfile />} />
        <Route path="/appointments" element={<Appointments />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patient/:id"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <PatientVisit />
          </ProtectedRoute>
        }
      />

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}