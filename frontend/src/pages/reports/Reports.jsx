
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  RefreshCw,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import api from '../../services/api'
import API_ENDPOINTS from '../../services/endpoints'

const CHART_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
]

const numberValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatNumber = (value) =>
  numberValue(value).toLocaleString()

const formatPercent = (value) =>
  `${numberValue(value).toFixed(1)}%`

const formatCurrency = (value, currency = 'USD') => {
  const amount = numberValue(value)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency || ''} ${amount.toLocaleString()}`
  }
}

const titleCase = (value = '') =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  'Unable to load this report.'

const getRepName = (row) => {
  const fullName = [
    row.assigned_to__first_name,
    row.assigned_to__last_name,
  ]
    .filter(Boolean)
    .join(' ')

  return fullName || row.assigned_to__username || 'Unknown user'
}

const downloadCSV = (filename, rows) => {
  if (!rows.length) return

  const headers = Object.keys(rows[0])

  const escapeCSV = (value) => {
    const text = String(value ?? '')
    return `"${text.replaceAll('"', '""')}"`
  }

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(',')
    ),
  ].join('\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function SectionCard({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Icon size={19} />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 text-sm text-red-700">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-700 underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function EmptyState({ message = 'No report data is available.' }) {
  return (
    <div className="flex min-h-36 items-center justify-center text-center text-sm text-gray-500">
      {message}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-gray-500">
      <RefreshCw size={17} className="animate-spin" />
      Loading report...
    </div>
  )
}

function DataTable({ columns, rows, emptyMessage }) {
  if (!rows?.length) return <EmptyState message={emptyMessage} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id ?? `${index}-${row.currency ?? ''}`}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-gray-700">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState({
    dashboard: null,
    pipeline: null,
    revenue: null,
    leadConversion: null,
    salesPerformance: null,
  })

  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})

  const loadReports = useCallback(async () => {
    setLoading(true)
    setErrors({})

    const requests = [
      ['dashboard', API_ENDPOINTS.REPORTS.SUMMARY],
      ['pipeline', API_ENDPOINTS.REPORTS.SALES_PIPELINE],
      ['revenue', API_ENDPOINTS.REPORTS.REVENUE],
      ['leadConversion', API_ENDPOINTS.REPORTS.LEAD_CONVERSION],
      ['salesPerformance', API_ENDPOINTS.REPORTS.SALES_PERFORMANCE],
    ]

    const results = await Promise.allSettled(
      requests.map(([, endpoint]) => api.get(endpoint))
    )

    const nextReports = {}
    const nextErrors = {}

    results.forEach((result, index) => {
      const key = requests[index][0]

      if (result.status === 'fulfilled') {
        nextReports[key] = result.value.data
      } else {
        nextReports[key] = null
        nextErrors[key] = getErrorMessage(result.reason)
      }
    })

    setReports((previous) => ({ ...previous, ...nextReports }))
    setErrors(nextErrors)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const dashboard = reports.dashboard
  const pipeline = reports.pipeline
  const revenue = reports.revenue
  const leadConversion = reports.leadConversion
  const salesPerformance = reports.salesPerformance

  const pipelineRows = pipeline?.pipeline || []
  const revenueRows = revenue?.revenue_by_currency || []
  const sourceRows = leadConversion?.conversion_by_source || []
  const performanceRows = salesPerformance?.performance || []

  const pipelineChartData = useMemo(
    () =>
      pipelineRows.map((row) => ({
        stage: titleCase(row.stage),
        dealCount: numberValue(row.deal_count),
        totalValue: numberValue(row.total_value),
        weightedValue: numberValue(row.weighted_value),
        currency: row.currency,
      })),
    [pipelineRows]
  )

  const leadChartData = useMemo(
    () =>
      sourceRows.map((row) => ({
        source: titleCase(row.source || 'Unknown'),
        totalLeads: numberValue(row.total_leads),
        convertedLeads: numberValue(row.converted_leads),
      })),
    [sourceRows]
  )

  const performanceChartData = useMemo(
    () =>
      performanceRows.map((row) => ({
        name: getRepName(row),
        wonDeals: numberValue(row.won_deals),
        lostDeals: numberValue(row.lost_deals),
        openDeals: numberValue(row.open_deals),
        currency: row.currency,
      })),
    [performanceRows]
  )

  const exportReports = () => {
    const rows = []

    revenueRows.forEach((row) => {
      rows.push({
        report: 'Revenue',
        category: 'Currency summary',
        name: row.currency,
        currency: row.currency,
        total_deals: row.total_deals,
        won_deals: row.won_deals,
        lost_deals: row.lost_deals,
        open_deals: row.open_deals,
        won_revenue: row.won_revenue,
        lost_deal_value: row.lost_deal_value,
        open_pipeline_value: row.open_pipeline_value,
        weighted_pipeline_revenue: row.weighted_pipeline_revenue,
      })
    })

    pipelineRows.forEach((row) => {
      rows.push({
        report: 'Sales Pipeline',
        category: 'Pipeline stage',
        name: row.stage,
        currency: row.currency,
        deal_count: row.deal_count,
        total_value: row.total_value,
        weighted_value: row.weighted_value,
      })
    })

    sourceRows.forEach((row) => {
      rows.push({
        report: 'Lead Conversion',
        category: 'Lead source',
        name: row.source,
        total_leads: row.total_leads,
        converted_leads: row.converted_leads,
        conversion_rate: row.conversion_rate,
      })
    })

    performanceRows.forEach((row) => {
      rows.push({
        report: 'Sales Performance',
        category: 'Sales representative',
        name: getRepName(row),
        currency: row.currency,
        total_deals: row.total_deals,
        won_deals: row.won_deals,
        lost_deals: row.lost_deals,
        open_deals: row.open_deals,
        won_revenue: row.won_revenue,
        weighted_pipeline: row.weighted_pipeline,
      })
    })

    downloadCSV('crm-reports.csv', rows)
  }

  const summary = dashboard || {}
  const customers = summary.customers || {}
  const leads = summary.leads || {}
  const opportunities = summary.opportunities || {}

  const dashboardError = errors.dashboard

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            CRM performance and sales insights from your database.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={exportReports}
            disabled={
              loading ||
              (!revenueRows.length &&
                !pipelineRows.length &&
                !sourceRows.length &&
                !performanceRows.length)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {dashboardError && (
        <ErrorMessage
          message={`Dashboard summary: ${dashboardError}`}
          onRetry={loadReports}
        />
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          CRM Overview
        </h2>

        {loading && !dashboard ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Customers"
              value={formatNumber(customers.total)}
              description={`${formatNumber(customers.active)} active customers`}
              icon={Users}
            />
            <MetricCard
              title="Total Leads"
              value={formatNumber(leads.total)}
              description={`${formatNumber(leads.converted)} converted`}
              icon={Target}
            />
            <MetricCard
              title="Total Opportunities"
              value={formatNumber(opportunities.total)}
              description={`${formatNumber(opportunities.won)} won`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Lead Conversion Rate"
              value={formatPercent(leads.conversion_rate)}
              description={`${formatNumber(leads.converted)} converted leads`}
              icon={PieChartIcon}
            />
          </div>
        )}
      </div>

      <SectionCard
        title="Revenue by Currency"
        subtitle="Won revenue and pipeline values are reported separately for each currency."
        icon={DollarSign}
      >
        {errors.revenue ? (
          <ErrorMessage
            message={errors.revenue}
            onRetry={loadReports}
          />
        ) : loading && !revenue ? (
          <LoadingState />
        ) : (
          <DataTable
            rows={revenueRows}
            emptyMessage="No revenue report data is available."
            columns={[
              { key: 'currency', label: 'Currency' },
              {
                key: 'total_deals',
                label: 'Total Deals',
                render: (value) => formatNumber(value),
              },
              {
                key: 'won_deals',
                label: 'Won',
                render: (value) => formatNumber(value),
              },
              {
                key: 'lost_deals',
                label: 'Lost',
                render: (value) => formatNumber(value),
              },
              {
                key: 'open_deals',
                label: 'Open',
                render: (value) => formatNumber(value),
              },
              {
                key: 'won_revenue',
                label: 'Won Revenue',
                render: (value, row) =>
                  formatCurrency(value, row.currency),
              },
              {
                key: 'open_pipeline_value',
                label: 'Open Pipeline',
                render: (value, row) =>
                  formatCurrency(value, row.currency),
              },
              {
                key: 'weighted_pipeline_revenue',
                label: 'Weighted Pipeline',
                render: (value, row) =>
                  formatCurrency(value, row.currency),
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Sales Pipeline"
        subtitle="Opportunity distribution by stage and currency."
        icon={BarChart3}
      >
        {errors.pipeline ? (
          <ErrorMessage
            message={errors.pipeline}
            onRetry={loadReports}
          />
        ) : loading && !pipeline ? (
          <LoadingState />
        ) : pipelineRows.length === 0 ? (
          <EmptyState message="No pipeline report data is available." />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total Deals</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(pipeline.total_deals)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Pipeline Stages</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(pipelineRows.length)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Currencies</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(
                    new Set(pipelineRows.map((row) => row.currency)).size
                  )}
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="dealCount"
                    name="Number of Deals"
                    fill="#6366f1"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5">
              <DataTable
                rows={pipelineRows}
                columns={[
                  {
                    key: 'stage',
                    label: 'Stage',
                    render: (value) => titleCase(value),
                  },
                  { key: 'currency', label: 'Currency' },
                  {
                    key: 'deal_count',
                    label: 'Deals',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'total_value',
                    label: 'Total Value',
                    render: (value, row) =>
                      formatCurrency(value, row.currency),
                  },
                  {
                    key: 'weighted_value',
                    label: 'Weighted Value',
                    render: (value, row) =>
                      formatCurrency(value, row.currency),
                  },
                ]}
              />
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Lead Conversion by Source"
        subtitle="Compare lead volume with converted leads for each source."
        icon={Target}
      >
        {errors.leadConversion ? (
          <ErrorMessage
            message={errors.leadConversion}
            onRetry={loadReports}
          />
        ) : loading && !leadConversion ? (
          <LoadingState />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(leadConversion?.overall?.total_leads)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Converted Leads</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatNumber(leadConversion?.overall?.converted_leads)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatPercent(leadConversion?.overall?.conversion_rate)}
                </p>
              </div>
            </div>

            {leadChartData.length === 0 ? (
              <EmptyState message="No lead source data is available." />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="totalLeads"
                      name="Total Leads"
                      fill="#0ea5e9"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="convertedLeads"
                      name="Converted Leads"
                      fill="#10b981"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-5">
              <DataTable
                rows={sourceRows}
                emptyMessage="No lead conversion sources are available."
                columns={[
                  {
                    key: 'source',
                    label: 'Source',
                    render: (value) => titleCase(value || 'Unknown'),
                  },
                  {
                    key: 'total_leads',
                    label: 'Total Leads',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'converted_leads',
                    label: 'Converted Leads',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'conversion_rate',
                    label: 'Conversion Rate',
                    render: (value) => formatPercent(value),
                  },
                ]}
              />
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Sales Performance"
        subtitle="Opportunity outcomes grouped by sales representative and currency."
        icon={TrendingUp}
      >
        {errors.salesPerformance ? (
          <ErrorMessage
            message={errors.salesPerformance}
            onRetry={loadReports}
          />
        ) : loading && !salesPerformance ? (
          <LoadingState />
        ) : (
          <>
            {performanceChartData.length > 0 && (
              <div className="mb-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="wonDeals"
                      name="Won Deals"
                      stackId="deals"
                      fill="#10b981"
                    />
                    <Bar
                      dataKey="lostDeals"
                      name="Lost Deals"
                      stackId="deals"
                      fill="#ef4444"
                    />
                    <Bar
                      dataKey="openDeals"
                      name="Open Deals"
                      stackId="deals"
                      fill="#6366f1"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <DataTable
              rows={performanceRows}
              emptyMessage="No sales performance data is available."
              columns={[
                {
                  key: 'assigned_to__username',
                  label: 'Sales Representative',
                  render: (_, row) => getRepName(row),
                },
                { key: 'currency', label: 'Currency' },
                {
                  key: 'total_deals',
                  label: 'Total Deals',
                  render: (value) => formatNumber(value),
                },
                {
                  key: 'won_deals',
                  label: 'Won',
                  render: (value) => formatNumber(value),
                },
                {
                  key: 'lost_deals',
                  label: 'Lost',
                  render: (value) => formatNumber(value),
                },
                {
                  key: 'open_deals',
                  label: 'Open',
                  render: (value) => formatNumber(value),
                },
                {
                  key: 'won_revenue',
                  label: 'Won Revenue',
                  render: (value, row) =>
                    formatCurrency(value, row.currency),
                },
                {
                  key: 'weighted_pipeline',
                  label: 'Weighted Pipeline',
                  render: (value, row) =>
                    formatCurrency(value, row.currency),
                },
              ]}
            />
          </>
        )}
      </SectionCard>

      <p className="text-center text-xs text-gray-400">
        Reports are generated from the CRM backend. Results depend on the
        records your account is permitted to access.
      </p>
    </div>
  )
}
