
import {
  Users,
  UserRoundPlus,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Clock,
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Sample data for the dashboard
const revenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 18000 },
  { month: 'Mar', revenue: 15000 },
  { month: 'Apr', revenue: 24000 },
  { month: 'May', revenue: 21000 },
  { month: 'Jun', revenue: 32000 },
  { month: 'Jul', revenue: 28000 },
  { month: 'Aug', revenue: 39000 },
  { month: 'Sep', revenue: 35000 },
  { month: 'Oct', revenue: 45000 },
  { month: 'Nov', revenue: 42000 },
  { month: 'Dec', revenue: 52000 },
]

const leadSourceData = [
  { name: 'Website', value: 45, color: '#2563eb' },
  { name: 'Referral', value: 30, color: '#16a34a' },
  { name: 'Social Media', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#94a3b8' },
]

const activities = [
  {
    title: 'New customer registered',
    description: 'John Smith was added to customers',
    time: '10 minutes ago',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Lead converted',
    description: 'Sarah Johnson became a customer',
    time: '1 hour ago',
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Deal updated',
    description: 'Website redesign deal moved to negotiation',
    time: '3 hours ago',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Follow-up scheduled',
    description: 'Meeting with Michael Brown',
    time: '5 hours ago',
    color: 'bg-purple-100 text-purple-600',
  },
]

const customers = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Tech Solutions',
    status: 'Active',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    company: 'Digital Works',
    status: 'Active',
  },
  {
    name: 'Michael Brown',
    email: 'michael@example.com',
    company: 'Global Systems',
    status: 'Pending',
  },
  {
    name: 'Emily Davis',
    email: 'emily@example.com',
    company: 'Creative Studio',
    status: 'Active',
  },
]

const stats = [
  {
    title: 'Total Customers',
    value: '1,248',
    change: '+12.5%',
    positive: true,
    icon: Users,
    iconStyle: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Total Leads',
    value: '356',
    change: '+8.2%',
    positive: true,
    icon: UserRoundPlus,
    iconStyle: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Active Deals',
    value: '84',
    change: '+5.4%',
    positive: true,
    icon: Target,
    iconStyle: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Total Revenue',
    value: '$48,250',
    change: '-2.4%',
    positive: false,
    icon: DollarSign,
    iconStyle: 'bg-green-100 text-green-600',
  },
]

function StatCard({ item }) {
  const Icon = item.icon
  const ChangeIcon = item.positive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {item.title}
        </p>

        <div className={`rounded-lg p-2.5 ${item.iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          {item.value}
        </h2>

        <span
          className={`flex items-center text-sm font-medium ${
            item.positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <ChangeIcon size={16} />
          {item.change}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Compared with last month
      </p>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here is what's happening with your CRM.
          </p>
        </div>

        <select
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
          defaultValue="This Year"
          aria-label="Dashboard date range"
        >
          <option>This Year</option>
          <option>This Month</option>
          <option>This Week</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Revenue chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">
                Revenue Overview
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Monthly revenue performance
              </p>
            </div>

            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Revenue chart options"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />

                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()}`,
                    'Revenue',
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead sources */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">
            Lead Sources
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Where your leads come from
          </p>

          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {leadSourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-3">
            {leadSourceData.map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-slate-600">
                    {source.name}
                  </span>
                </div>

                <span className="font-semibold text-slate-700">
                  {source.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity and customers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Activities */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Recent Activities
            </h2>

            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>

          <div className="space-y-5">
            {activities.map((activity, index) => (
              <div key={index} className="flex gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Clock size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customers table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Recent Customers
            </h2>

            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.email}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 pr-3">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-700">
                        {customer.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {customer.email}
                      </p>
                    </td>

                    <td className="py-4 pr-3 text-sm text-slate-600">
                      {customer.company}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          customer.status === 'Active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Dashboard figures are illustrative sample data, not live CRM records.
      </p>
    </div>
  )
}

export default Dashboard
