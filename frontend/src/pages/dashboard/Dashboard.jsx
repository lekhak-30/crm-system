
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserRoundPlus,
  Target,
  DollarSign,
  Clock,
  RefreshCw,
  CalendarDays,
  CheckCircle,
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

import api from '../../services/api'
import { useSettings } from '../../context/SettingsContext'
import { formatDate, formatDateTime } from '../../utils/date'
import {
  formatCurrency,
  groupAmountsByCurrency,
  formatCurrencyGroups,
} from '../../utils/currency'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#94a3b8']

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DATE_RANGES = [
  { label: 'This Year', value: 'year' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'All Time', value: 'all' },
]

async function fetchAllPages(url) {
  let nextUrl = url
  const records = []

  while (nextUrl) {
    const response = await api.get(nextUrl)
    const data = response.data

    records.push(...(Array.isArray(data) ? data : data.results || []))
    nextUrl = Array.isArray(data) ? null : data.next
  }

  return records
}

function getCustomerName(customer) {
  return (
    customer.company_name ||
    customer.name ||
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
    'Unnamed customer'
  )
}

function getLeadSource(lead) {
  return lead.source || lead.lead_source || 'Other'
}

function getDate(value) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWithinRange(value, range) {
  const date = getDate(value)
  if (!date) return false

  const now = new Date()

  if (range === 'all') return true

  if (range === 'year') {
    return date.getFullYear() === now.getFullYear()
  }

  if (range === 'month') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    )
  }

  const startOfWeek = new Date(now)
  const day = (now.getDay() + 6) % 7

  startOfWeek.setDate(now.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)

  return date >= startOfWeek && date <= now
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

function formatMoneyGroups(groups, defaultCurrency = 'NPR') {
  const entries = formatCurrencyGroups(groups)

  if (entries.length === 0) {
    return formatCurrency(0, defaultCurrency)
  }

  return entries.map((item) => item.formatted).join(' · ')
}

function getErrorMessage(error) {
  const data = error.response?.data

  if (data?.detail) return data.detail

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
      )
      .join('\n')
  }

  return error.message || 'Unable to load dashboard data.'
}

function StatCard({ title, value, subtitle, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const { settings } = useSettings()

  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [activities, setActivities] = useState([])

  const [dateRange, setDateRange] = useState('year')

  const [selectedRevenueCurrency, setSelectedRevenueCurrency] =
    useState(settings.currency)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Keep the chart selection synchronized with global currency settings.
  useEffect(() => {
    setSelectedRevenueCurrency(settings.currency)
  }, [settings.currency])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        customerData,
        leadData,
        opportunityData,
        activityData,
      ] = await Promise.all([
        fetchAllPages('/customers/'),
        fetchAllPages('/leads/'),
        fetchAllPages('/opportunities/'),
        fetchAllPages('/activities/'),
      ])

      setCustomers(customerData)
      setLeads(leadData)
      setOpportunities(opportunityData)
      setActivities(activityData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) =>
        isWithinRange(
          lead.created_at || lead.created,
          dateRange
        )
      ),
    [leads, dateRange]
  )

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((opportunity) =>
        isWithinRange(
          opportunity.created_at || opportunity.created,
          dateRange
        )
      ),
    [opportunities, dateRange]
  )

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) =>
        isWithinRange(
          activity.created_at || activity.created,
          dateRange
        )
      ),
    [activities, dateRange]
  )

  const wonOpportunities = filteredOpportunities.filter(
    (item) => item.stage === 'WON'
  )

  const activeOpportunities = filteredOpportunities.filter(
    (item) => !['WON', 'LOST'].includes(item.stage)
  )

  // Keep different currencies separate. No implicit conversion.
  const revenue = groupAmountsByCurrency(wonOpportunities)
  const pipelineValue = groupAmountsByCurrency(activeOpportunities)

  const revenueCurrencies = [
    ...new Set(
      wonOpportunities.map((item) => item.currency || 'NPR')
    ),
  ].sort()

  const effectiveRevenueCurrency = revenueCurrencies.includes(
    selectedRevenueCurrency
  )
    ? selectedRevenueCurrency
    : revenueCurrencies[0] || settings.currency

  const pendingActivities = activities.filter(
    (item) => ['PLANNED', 'IN_PROGRESS'].includes(item.status)
  ).length

  const completedActivities = activities.filter(
    (item) => item.status === 'COMPLETED'
  ).length

  const overdueActivities = activities.filter((item) => {
    const dueDate = getDate(item.due_at)

    return (
      dueDate &&
      dueDate < new Date() &&
      ['PLANNED', 'IN_PROGRESS'].includes(item.status)
    )
  }).length

  const conversionRate = filteredLeads.length
    ? (
        filteredLeads.filter(
          (lead) =>
            lead.status === 'CONVERTED' ||
            lead.is_converted === true
        ).length / filteredLeads.length
      ) * 100
    : 0

  const revenueData = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()

    return MONTHS.map((month, index) => {
      const monthRevenue = wonOpportunities
        .filter((item) => {
          const closeDate = getDate(
            item.actual_close_date ||
            item.updated_at ||
            item.created_at
          )

          return (
            closeDate &&
            closeDate.getFullYear() === year &&
            closeDate.getMonth() === index &&
            (item.currency || 'NPR') === effectiveRevenueCurrency
          )
        })
        .reduce(
          (total, item) => total + Number(item.amount || 0),
          0
        )

      return { month, revenue: monthRevenue }
    })
  }, [wonOpportunities, effectiveRevenueCurrency])

  const leadSourceData = useMemo(() => {
    const sourceCounts = {}

    filteredLeads.forEach((lead) => {
      const source = getLeadSource(lead)
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })

    const total = filteredLeads.length

    return Object.entries(sourceCounts)
      .map(([name, value], index) => ({
        name,
        value: total ? Math.round((value / total) * 100) : 0,
        count: value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredLeads])

  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort(
          (a, b) =>
            new Date(b.created_at || b.created || 0) -
            new Date(a.created_at || a.created || 0)
        )
        .slice(0, 5),
    [activities]
  )

  const recentCustomers = useMemo(
    () =>
      [...customers]
        .sort(
          (a, b) =>
            new Date(b.created_at || b.created || 0) -
            new Date(a.created_at || a.created || 0)
        )
        .slice(0, 5),
    [customers]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your CRM performance and sales activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
            aria-label="Dashboard date range"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">
            Dashboard could not load all data.
          </p>
          <p className="mt-1 whitespace-pre-line">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Loading dashboard data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Customers"
              value={customers.length.toLocaleString()}
              subtitle="All accessible customer records"
              icon={Users}
              iconStyle="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="Total Leads"
              value={filteredLeads.length.toLocaleString()}
              subtitle={`Leads for ${DATE_RANGES.find((item) => item.value === dateRange)?.label.toLowerCase()}`}
              icon={UserRoundPlus}
              iconStyle="bg-purple-100 text-purple-600"
            />

            <StatCard
              title="Active Opportunities"
              value={activeOpportunities.length.toLocaleString()}
              subtitle={`Pipeline: ${formatMoneyGroups(pipelineValue, settings.currency)}`}
              icon={Target}
              iconStyle="bg-amber-100 text-amber-600"
            />

            <StatCard
              title="Won Revenue"
              value={formatMoneyGroups(revenue, settings.currency)}
              subtitle={`${wonOpportunities.length} won opportunities in selected period`}
              icon={DollarSign}
              iconStyle="bg-green-100 text-green-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Revenue Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Monthly won revenue for {effectiveRevenueCurrency} ({new Date().getFullYear()})
                  </p>
                </div>

                <select
                  value={effectiveRevenueCurrency}
                  onChange={(event) =>
                    setSelectedRevenueCurrency(event.target.value)
                  }
                  disabled={revenueCurrencies.length === 0}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
                  aria-label="Revenue chart currency"
                >
                  {revenueCurrencies.length === 0 ? (
                    <option value={settings.currency}>
                      {settings.currency}
                    </option>
                  ) : (
                    revenueCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))
                  )}
                </select>
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
                      tickFormatter={(value) => formatAmount(value)}
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value, effectiveRevenueCurrency),
                        'Won revenue',
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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">
                Lead Sources
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Distribution of leads by source
              </p>

              {leadSourceData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No lead source data available.
                </div>
              ) : (
                <>
                  <div className="mt-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadSourceData}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                        >
                          {leadSourceData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 max-h-40 space-y-3 overflow-y-auto">
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
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Pending Activities"
              value={pendingActivities}
              subtitle="Planned and in-progress activities"
              icon={Clock}
              iconStyle="bg-blue-100 text-blue-600"
            />

            <StatCard
              title="Completed Activities"
              value={completedActivities}
              subtitle="All completed activities"
              icon={CheckCircle}
              iconStyle="bg-green-100 text-green-600"
            />

            <StatCard
              title="Overdue Activities"
              value={overdueActivities}
              subtitle="Pending activities past their due date"
              icon={CalendarDays}
              iconStyle="bg-red-100 text-red-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 font-semibold text-slate-800">
                Recent Activities
              </h2>

              {recentActivities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No activities found.
                </p>
              ) : (
                <div className="space-y-5">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3"
                    >
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <Clock size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {activity.subject || 'Activity'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {activity.description || activity.activity_type || ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(
                            activity.created_at || activity.created,
                            settings.dateFormat
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 font-semibold text-slate-800">
                Recent Customers
              </h2>

              {recentCustomers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No customers found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Company</th>
                        <th className="pb-3 font-medium">Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-4 pr-3">
                            <p className="whitespace-nowrap text-sm font-medium text-slate-700">
                              {getCustomerName(customer)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {customer.email || 'No email'}
                            </p>
                          </td>

                          <td className="py-4 pr-3 text-sm text-slate-600">
                            {customer.company_name || customer.company || '—'}
                          </td>

                          <td className="py-4 text-xs text-slate-500">
                            {formatDate(
                              customer.created_at || customer.created,
                              settings.dateFormat
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Dashboard financial totals are grouped by their original currencies.
            The revenue chart displays one selected currency at a time.
            No automatic currency conversion is performed.
          </p>
        </>
      )}
    </div>
  )
}

export default Dashboard
