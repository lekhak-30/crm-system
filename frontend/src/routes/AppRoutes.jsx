import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import DashboardLayout from '../layouts/DashboardLayout'

import Dashboard from '../pages/dashboard/Dashboard'
import Customers from '../pages/customers/Customers'
import Leads from '../pages/leads/Leads'
import Opportunities from '../pages/opportunities/Opportunities'
import Activities from '../pages/activities/Activities'
import Reports from '../pages/reports/Reports'
import Users from '../pages/users/Users'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<Users />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes