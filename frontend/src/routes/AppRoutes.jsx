
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

import DashboardLayout from '../layouts/DashboardLayout'

import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'

import Dashboard from '../pages/dashboard/Dashboard'
import Customers from '../pages/customers/Customers'
import Leads from '../pages/leads/Leads'
import Opportunities from '../pages/opportunities/Opportunities'
import Activities from '../pages/activities/Activities'
import Reports from '../pages/reports/Reports'
import Users from '../pages/users/Users'
import SettingsPage from '../pages/settings/Settings'

const ALL_ROLES = [
  'Administrator',
  'Sales Manager',
  'Sales Employee',
]

const MANAGEMENT_ROLES = [
  'Administrator',
  'Sales Manager',
]

function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
            <Route path="/settings" element={<SettingsPage />} />

              <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/activities" element={<Activities />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES} />}>
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
                <Route path="/users" element={<Users />} />
              </Route>

            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default AppRoutes
