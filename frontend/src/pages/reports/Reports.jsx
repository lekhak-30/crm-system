
import { useMemo, useState } from 'react'
import {
  Download,
  DollarSign,
  Users,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 12000, expenses: 7000 },
  { month: 'Feb', revenue: 18000, expenses: 9000 },
  { month: 'Mar', revenue: 15000, expenses: 8000 },
  { month: 'Apr', revenue: 24000, expenses: 12000 },
  { month: 'May', revenue: 21000, expenses: 11000 },
  { month: 'Jun', revenue: 32000, expenses: 16000 },
  { month: 'Jul', revenue: 28000, expenses: 14000 },
  { month: 'Aug', revenue: 39000, expenses: 18000 },
  { month: 'Sep', revenue: 35000, expenses: 17000 },
  { month: 'Oct', revenue: 45000, expenses: 21000 },
  { month: 'Nov', revenue: 42000, expenses: 20000 },
  { month: 'Dec', revenue: 52000, expenses: 24000 },
]

const leadData = [
  { status: 'New', count: 120 },
  { status: 'Contacted', count: 85 },
  { status: 'Qualified', count: 65 },
  { status: 'Proposal', count: 45 },
  { status: 'Converted', count: 28 },
  { status: 'Lost', count: 13 },
]

const pipelineData = [
  { name: 'Qualification', value: 15, color: '#2563eb' },
  { name: 'Needs Analysis', value: 20, color: '#8b5cf6' },
  { name: 'Proposal', value: 30, color: '#f59e0b' },
  { name: 'Negotiation', value: 20, color: '#f97316' },
  { name: 'Closed Won', value: 15, color: '#16a34a' },
]

const salesData = [
  { name: 'Alex', revenue: 42000, deals: 12 },
  { name: 'Sarah', revenue: 35000, deals: 10 },
  { name: 'Michael', revenue: 28000, deals: 8 },
  { name: 'Emily', revenue: 46000, deals: 14 },
  { name: 'David', revenue: 31000, deals: 9 },
]

const customerGrowthData = [
  { month: 'Jan', customers: 80 },
  { month: 'Feb', customers: 95 },
  { month: 'Mar', customers: 110 },
  { month: 'Apr', customers: 125 },
  { month: 'May', customers: 140 },
  { month: 'Jun', customers: 165 },
  { month: 'Jul', customers: 180 },
  { month: 'Aug', customers: 205 },
  { month: 'Sep', customers: 225 },
  { month: 'Oct', customers: 250 },
  { month: 'Nov', customers: 280 },
  { month: 'Dec', customers: 310 },
]

function Reports() {
  const [dateRange, setDateRange] = useState('All Months')

  // Filter monthly revenue data.
  const filteredRevenueData = useMemo(() => {
    if (dateRange === 'Last 3 Months') {
      return revenueData.slice(-3)
    }

    if (dateRange === 'Last 6 Months') {
      return revenueData.slice(-6)
    }

    return revenueData
  }, [dateRange])

  // Filter monthly customer growth data.
  const filteredCustomerGrowthData = useMemo(() => {
    if (dateRange === 'Last 3 Months') {
      return customerGrowthData.slice(-3)
    }

    if (dateRange === 'Last 6 Months') {
      return customerGrowthData.slice(-6)
    }

    return customerGrowthData
  }, [dateRange])

  // Calculate revenue from the selected period.
  const totalRevenue = useMemo(
    () =>
      filteredRevenueData.reduce(
        (sum, item) => sum + item.revenue,
        0
      ),
    [filteredRevenueData]
  )

  const totalExpenses = useMemo(
    () =>
      filteredRevenueData.reduce(
        (sum, item) => sum + item.expenses,
        0
      ),
    [filteredRevenueData]
  )

  const exportCSV = () => {
    const rows = [
      ['Month', 'Revenue', 'Expenses'],
      ...filteredRevenueData.map((item) => [
        item.month,
        item.revenue,
        item.expenses,
      ]),
      [],
      ['Selected Period', dateRange],
      ['Total Revenue', totalRevenue],
      ['Total Expenses', totalExpenses],
      ['Profit Before Other Costs', totalRevenue - totalExpenses],
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `crm-revenue-report-${dateRange
      .toLowerCase()
      .replaceAll(' ', '-')}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const reportStats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US')}`,
      change: dateRange,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Total Customers',
      value: '1,248',
      change: 'Sample metric',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Opportunities',
      value: '184',
      change: 'Sample metric',
      icon: Target,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Conversion Rate',
      value: '18.7%',
      change: 'Sample metric',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze your business performance and sales trends.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            aria-label="Report period"
          >
            <option>All Months</option>
            <option>Last 6 Months</option>
            <option>Last 3 Months</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportStats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.title}</p>

                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-800">
                {item.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {item.change}
              </p>
            </div>
          )
        })}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-800">
            Revenue & Expenses
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monthly financial performance · {dateRange}
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredRevenueData}>
              <defs>
                <linearGradient
                  id="reportRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="month" />

              <YAxis
                tickFormatter={(value) => `$${value / 1000}k`}
              />

              <Tooltip
                formatter={(value) =>
                  `$${Number(value).toLocaleString('en-US')}`
                }
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#reportRevenue)"
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="mt-1 font-semibold text-slate-800">
              ${totalRevenue.toLocaleString('en-US')}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Total Expenses</p>
            <p className="mt-1 font-semibold text-slate-800">
              ${totalExpenses.toLocaleString('en-US')}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Profit Before Other Costs</p>
            <p className="mt-1 font-semibold text-green-600">
              ${(totalRevenue - totalExpenses).toLocaleString('en-US')}
            </p>
          </div>
        </div>
      </div>

      {/* Lead and pipeline charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">
            Lead Status Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Number of leads by status
          </p>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">
            Sales Pipeline Distribution
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Distribution across sales stages
          </p>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pipelineData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales performance */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">
          Sales Representative Performance
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Revenue generated by sales representatives
        </p>

        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value) =>
                  `$${Number(value).toLocaleString('en-US')}`
                }
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#2563eb"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer growth */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">
          Customer Growth
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Monthly customer acquisition trend · {dateRange}
        </p>

        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredCustomerGrowthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="#16a34a"
                strokeWidth={3}
                fill="#16a34a"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        All report metrics and charts use illustrative sample data.
        The period selector filters monthly revenue and customer-growth
        charts only. Other charts and summary metrics are not period-filtered.
        These reports are not connected to the Django database.
      </p>
    </div>
  )
}

export default Reports
