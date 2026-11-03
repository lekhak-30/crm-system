import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserRoundPlus,
  Target,
  CalendarCheck,
  ChartNoAxesCombined,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Leads', path: '/leads', icon: UserRoundPlus },
  { name: 'Sales Pipeline', path: '/opportunities', icon: Target },
  { name: 'Activities', path: '/activities', icon: CalendarCheck },
  { name: 'Reports', path: '/reports', icon: ChartNoAxesCombined },
  { name: 'Team Members', path: '/users', icon: Users },
]

function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
        <h1 className="text-xl font-bold text-blue-700">
          CRM Workspace
        </h1>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="text-slate-500 md:hidden"
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
      </div>

      <nav className="space-y-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50">

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white md:block">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation overlay"
          />

          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="md:ml-64">

        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-600 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <span className="font-semibold text-slate-700">
              CRM Management
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                Admin User
              </p>
              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              A
            </div>
          </div>

        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout