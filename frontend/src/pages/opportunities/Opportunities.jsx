
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  DollarSign,
  CalendarDays,
  Target,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

import api from '../../services/api'
import API_ENDPOINTS from '../../services/endpoints'
import { useSettings } from '../../context/SettingsContext'
import { formatDate } from '../../utils/date'

const STAGES = [
  { value: 'PROSPECTING', label: 'Prospecting', color: 'bg-slate-500' },
  { value: 'QUALIFICATION', label: 'Qualification', color: 'bg-blue-500' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-500' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-purple-500' },
  { value: 'WON', label: 'Won', color: 'bg-green-500' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-500' },
]

const OPEN_STAGES = STAGES.filter(
  (stage) => !['WON', 'LOST'].includes(stage.value)
)

function createEmptyForm(currency = 'NPR') {
  return {
    title: '',
    customer: '',
    description: '',
    amount: '',
    currency,
    stage: 'PROSPECTING',
    probability: '10',
    expected_close_date: '',
  }
}

function getErrorMessage(error) {
  const data = error?.response?.data

  if (!data) {
    return error?.message || 'Something went wrong. Please try again.'
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(' ')
        : typeof messages === 'string'
          ? messages
          : JSON.stringify(messages)

      return `${field.replaceAll('_', ' ')}: ${message}`
    })
    .join(' | ')
}

function getCustomerLabel(customer) {
  const fullName = [
    customer.first_name,
    customer.last_name,
  ].filter(Boolean).join(' ')

  if (fullName && customer.company) {
    return `${fullName} — ${customer.company}`
  }

  return (
    fullName ||
    customer.company ||
    customer.email ||
    `Customer #${customer.id}`
  )
}

function formatMoney(amount, currency = 'NPR') {
  const value = Number(amount || 0)
  const safeCurrency = currency || 'NPR'

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${safeCurrency} ${value.toLocaleString()}`
  }
}

/*
 * Amounts in different currencies must never be added together.
 * This helper groups records by their stored currency.
 */
function groupAmountsByCurrency(records, getAmount) {
  return records.reduce((groups, record) => {
    const currency = record.currency || 'NPR'
    const amount = Number(getAmount(record) || 0)

    groups[currency] = (groups[currency] || 0) + amount

    return groups
  }, {})
}

function formatCurrencyGroups(groups) {
  const entries = Object.entries(groups)

  if (entries.length === 0) {
    return '—'
  }

  return entries
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(' + ')
}

function Opportunities() {
  const { settings } = useSettings()
  const defaultCurrency = settings.currency || 'NPR'
  const dateFormat = settings.dateFormat || 'DD/MM/YYYY'

  const [opportunities, setOpportunities] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState(null)
  const [form, setForm] = useState(() => createEmptyForm(defaultCurrency))
  const [formError, setFormError] = useState('')
  const [lostOpportunity, setLostOpportunity] = useState(null)
  const [lostReason, setLostReason] = useState('')
  const [closing, setClosing] = useState(false)

  const loadAllPages = useCallback(async (url) => {
    let nextUrl = url
    const records = []

    while (nextUrl) {
      const response = await api.get(nextUrl)
      const data = response.data

      if (Array.isArray(data)) {
        records.push(...data)
        break
      }

      records.push(...(data.results || []))
      nextUrl = data.next || null

      if (nextUrl && !nextUrl.startsWith('http')) {
        continue
      }

      if (nextUrl) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL

        if (!baseUrl || !nextUrl.startsWith(baseUrl)) {
          throw new Error(
            'The API returned an unexpected pagination URL.'
          )
        }

        nextUrl = nextUrl.replace(baseUrl, '')
      }
    }

    return records
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [opportunityData, customerData] = await Promise.all([
        loadAllPages(API_ENDPOINTS.OPPORTUNITIES.LIST),
        loadAllPages(API_ENDPOINTS.CUSTOMERS.LIST),
      ])

      setOpportunities(opportunityData)
      setCustomers(customerData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [loadAllPages])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return opportunities

    return opportunities.filter((item) => {
      const customerName = item.customer_name || ''

      return (
        (item.title || '').toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        (item.stage || '').toLowerCase().includes(query)
      )
    })
  }, [opportunities, search])

  const activeOpportunities = opportunities.filter(
    (item) => !['WON', 'LOST'].includes(item.stage)
  )

  const wonOpportunities = opportunities.filter(
    (item) => item.stage === 'WON'
  )

  const pipelineTotals = useMemo(
    () =>
      groupAmountsByCurrency(
        activeOpportunities,
        (item) => item.amount
      ),
    [activeOpportunities]
  )

  const weightedPipelineTotals = useMemo(
    () =>
      groupAmountsByCurrency(
        activeOpportunities,
        (item) => item.weighted_value
      ),
    [activeOpportunities]
  )

  const wonTotals = useMemo(
    () =>
      groupAmountsByCurrency(
        wonOpportunities,
        (item) => item.amount
      ),
    [wonOpportunities]
  )

  const openAddModal = () => {
    setEditingOpportunity(null)
    setForm(createEmptyForm(defaultCurrency))
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    if (['WON', 'LOST'].includes(item.stage)) return

    setEditingOpportunity(item)

    setForm({
      title: item.title || '',
      customer: String(item.customer || ''),
      description: item.description || '',
      amount: String(item.amount ?? ''),
      currency: item.currency || defaultCurrency,
      stage: item.stage || 'PROSPECTING',
      probability: String(item.probability ?? 10),
      expected_close_date: item.expected_close_date || '',
    })

    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingOpportunity(null)
    setForm(createEmptyForm(defaultCurrency))
    setFormError('')
  }

  const updateForm = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      setFormError('Opportunity title is required.')
      return
    }

    if (!form.customer) {
      setFormError('Please select a customer.')
      return
    }

    if (
      form.amount === '' ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) < 0
    ) {
      setFormError('Enter a valid non-negative amount.')
      return
    }

    if (
      form.probability === '' ||
      !Number.isFinite(Number(form.probability)) ||
      Number(form.probability) < 0 ||
      Number(form.probability) > 100
    ) {
      setFormError('Probability must be between 0 and 100.')
      return
    }

    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      setFormError('Enter a valid three-letter currency code.')
      return
    }

    if (['WON', 'LOST'].includes(form.stage)) {
      setFormError(
        'Use the closing actions to mark an opportunity Won or Lost.'
      )
      return
    }

    const payload = {
      title: form.title.trim(),
      customer: Number(form.customer),
      description: form.description.trim(),
      amount: form.amount,
      currency: form.currency.trim().toUpperCase(),
      stage: form.stage,
      probability: form.probability,
      expected_close_date: form.expected_close_date || null,
    }

    setSaving(true)

    try {
      if (editingOpportunity) {
        await api.patch(
          API_ENDPOINTS.OPPORTUNITIES.DETAIL(editingOpportunity.id),
          payload
        )
      } else {
        await api.post(
          API_ENDPOINTS.OPPORTUNITIES.LIST,
          payload
        )
      }

      closeModal()
      await loadData()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteOpportunity = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setError('')

    try {
      await api.delete(
        API_ENDPOINTS.OPPORTUNITIES.DETAIL(item.id)
      )

      setOpportunities((previous) =>
        previous.filter(
          (opportunity) => opportunity.id !== item.id
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const closeAsWon = async (item) => {
    const confirmed = window.confirm(
      `Mark "${item.title}" as Won?`
    )

    if (!confirmed) return

    setClosing(true)
    setError('')

    try {
      const response = await api.post(
        `${API_ENDPOINTS.OPPORTUNITIES.DETAIL(item.id)}close-won/`
      )

      setOpportunities((previous) =>
        previous.map((opportunity) =>
          opportunity.id === item.id
            ? response.data
            : opportunity
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setClosing(false)
    }
  }

  const openLostDialog = (item) => {
    setLostOpportunity(item)
    setLostReason('')
    setError('')
  }

  const closeAsLost = async (event) => {
    event.preventDefault()

    if (!lostReason.trim()) {
      setError(
        'A reason is required to close an opportunity as Lost.'
      )
      return
    }

    setClosing(true)
    setError('')

    try {
      const response = await api.post(
        `${API_ENDPOINTS.OPPORTUNITIES.DETAIL(lostOpportunity.id)}close-lost/`,
        { lost_reason: lostReason.trim() }
      )

      setOpportunities((previous) =>
        previous.map((opportunity) =>
          opportunity.id === lostOpportunity.id
            ? response.data
            : opportunity
        )
      )

      setLostOpportunity(null)
      setLostReason('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sales Opportunities
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your sales pipeline and manage opportunities.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Opportunity
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active Opportunities"
          value={activeOpportunities.length}
          icon={Target}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Pipeline Value"
          value={formatCurrencyGroups(pipelineTotals)}
          icon={DollarSign}
          color="bg-purple-50 text-purple-600"
        />

        <SummaryCard
          title="Weighted Pipeline"
          value={formatCurrencyGroups(weightedPipelineTotals)}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          title="Closed Won"
          value={formatCurrencyGroups(wonTotals)}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search opportunities..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Loading and Kanban board */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <RefreshCw
            size={25}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading opportunities...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {STAGES.map((stage) => {
            const stageItems = filteredOpportunities.filter(
              (item) => item.stage === stage.value
            )

            const stageTotals = groupAmountsByCurrency(
              stageItems,
              (item) => item.amount
            )

            return (
              <section
                key={stage.value}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-100/70 p-3"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${stage.color}`}
                    />
                    <h2 className="text-sm font-semibold text-slate-700">
                      {stage.label}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                      {stageItems.length}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {formatCurrencyGroups(stageTotals)}
                  </p>
                </div>

                <div className="space-y-3">
                  {stageItems.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      item={item}
                      dateFormat={dateFormat}
                      onEdit={() => openEditModal(item)}
                      onDelete={() => deleteOpportunity(item)}
                      onWon={() => closeAsWon(item)}
                      onLost={() => openLostDialog(item)}
                      closing={closing}
                    />
                  ))}

                  {stageItems.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-xs text-slate-400">
                      No opportunities
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingOpportunity
                  ? 'Edit Opportunity'
                  : 'Add Opportunity'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5"
            >
              <FormField
                label="Opportunity Title"
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="Enter opportunity title"
                required
              />

              <div>
                <label
                  htmlFor="customer"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Customer
                </label>

                <select
                  id="customer"
                  name="customer"
                  value={form.customer}
                  onChange={updateForm}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerLabel(customer)}
                    </option>
                  ))}
                </select>

                {customers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No customers are available. Create or assign a customer first.
                  </p>
                )}
              </div>

              <FormField
                label="Description"
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Describe this opportunity"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={updateForm}
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                />

                <FormField
                  label="Currency"
                  name="currency"
                  value={form.currency}
                  onChange={updateForm}
                  placeholder="NPR"
                  required
                  maxLength={3}
                />

                <div>
                  <label
                    htmlFor="stage"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Stage
                  </label>
                  <select
                    id="stage"
                    name="stage"
                    value={form.stage}
                    onChange={updateForm}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {OPEN_STAGES.map((stage) => (
                      <option
                        key={stage.value}
                        value={stage.value}
                      >
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <FormField
                  label="Probability (%)"
                  name="probability"
                  type="number"
                  value={form.probability}
                  onChange={updateForm}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />

                <div className="sm:col-span-2">
                  <FormField
                    label="Expected Close Date"
                    name="expected_close_date"
                    type="date"
                    value={form.expected_close_date}
                    onChange={updateForm}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                New opportunities default to your global currency setting.
                Existing opportunities retain their saved currency.
              </p>

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || customers.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingOpportunity
                      ? 'Save Changes'
                      : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close as Lost modal */}
      {lostOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Close Opportunity as Lost
              </h2>

              <button
                type="button"
                onClick={() => setLostOpportunity(null)}
                disabled={closing}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={closeAsLost} className="space-y-4 p-5">
              <p className="text-sm text-slate-600">
                Provide a reason for losing "{lostOpportunity.title}".
              </p>

              <div>
                <label
                  htmlFor="lost_reason"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Lost Reason
                </label>
                <textarea
                  id="lost_reason"
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value)}
                  rows={4}
                  required
                  placeholder="Explain why this opportunity was lost..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setLostOpportunity(null)}
                  disabled={closing}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={closing || !lostReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Confirm Lost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OpportunityCard({
  item,
  dateFormat,
  onEdit,
  onDelete,
  onWon,
  onLost,
  closing,
}) {
  const isClosed = ['WON', 'LOST'].includes(item.stage)

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          {item.title}
        </h3>

        <div className="flex shrink-0 gap-1">
          {!isClosed && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit opportunity"
              aria-label="Edit opportunity"
              className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            title="Delete opportunity"
            aria-label="Delete opportunity"
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {item.customer_name || `Customer #${item.customer}`}
      </p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">Amount</span>
          <span className="text-right font-semibold text-slate-800">
            {formatMoney(item.amount, item.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Probability</span>
          <span className="font-medium text-slate-700">
            {Number(item.probability || 0)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">Weighted value</span>
          <span className="text-right font-medium text-slate-700">
            {formatMoney(item.weighted_value, item.currency)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <CalendarDays size={14} />
          <span>
            Expected: {formatDate(item.expected_close_date, dateFormat)}
          </span>
        </div>

        {item.assigned_to_name && (
          <p className="text-xs text-slate-400">
            Assigned to: {item.assigned_to_name}
          </p>
        )}
      </div>

      {item.stage === 'LOST' && item.lost_reason && (
        <div className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
          <strong>Lost reason:</strong> {item.lost_reason}
        </div>
      )}

      {!isClosed && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onWon}
            disabled={closing}
            className="flex items-center justify-center gap-1 rounded-md bg-green-50 px-2 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            <CheckCircle size={14} />
            Won
          </button>

          <button
            type="button"
            onClick={onLost}
            disabled={closing}
            className="flex items-center justify-center gap-1 rounded-md bg-red-50 px-2 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={14} />
            Lost
          </button>
        </div>
      )}

      {isClosed && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <span
            className={`text-xs font-semibold ${
              item.stage === 'WON'
                ? 'text-green-700'
                : 'text-red-700'
            }`}
          >
            {item.stage === 'WON' ? 'Closed Won' : 'Closed Lost'}
          </span>
        </div>
      )}
    </article>
  )
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 break-words text-xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
  max,
  step,
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  )
}

export default Opportunities
