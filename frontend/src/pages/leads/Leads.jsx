
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  UserRoundPlus,
  CheckCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'

import api from '../../services/api'
import API_ENDPOINTS from '../../services/endpoints'

const statuses = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
  'CONVERTED',
]

const sources = [
  'WEBSITE',
  'REFERRAL',
  'SOCIAL_MEDIA',
  'EMAIL',
  'PHONE',
  'ADVERTISEMENT',
  'OTHER',
]

const statusLabels = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
  CONVERTED: 'Converted',
}

const sourceLabels = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  EMAIL: 'Email',
  PHONE: 'Phone',
  ADVERTISEMENT: 'Advertisement',
  OTHER: 'Other',
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  company: '',
  phone: '',
  source: 'WEBSITE',
  status: 'NEW',
}

function getErrorMessage(error) {
  const data = error.response?.data

  if (!data) {
    return 'Something went wrong. Please check your connection.'
  }

  if (typeof data.detail === 'string') {
    return data.detail
  }

  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(', ')
          : String(messages)

        return `${field}: ${message}`
      })
      .join(' | ')
  }

  return 'Request failed.'
}

function formatLead(lead) {
  return {
    ...lead,
    name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    assignedTo:
      lead.assigned_to_name ||
      lead.assigned_to_username ||
      'Unassigned',
  }
}

function Leads() {
  const [leads, setLeads] = useState([])
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const pageSize = 10

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setApiError('')

      const response = await api.get(API_ENDPOINTS.LEADS.LIST, {
        params: {
          page: currentPage,
          search: search.trim() || undefined,
        },
      })

      const data = response.data
      const results = Array.isArray(data)
        ? data
        : data.results || []

      setLeads(results.map(formatLead))
      setTotalCount(data.count ?? results.length)
    } catch (error) {
      console.error('Failed to load leads:', error)
      setApiError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [currentPage, search])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  )

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'All') {
      return leads
    }

    return leads.filter(
      (lead) => lead.status === statusFilter
    )
  }, [leads, statusFilter])

  const convertedLeads = leads.filter(
    (lead) => lead.status === 'CONVERTED'
  ).length

  const activeLeads = totalCount - convertedLeads

  const conversionRate = totalCount
    ? Math.round((convertedLeads / totalCount) * 100)
    : 0

  const openAddModal = () => {
    setEditingLead(null)
    setForm({ ...emptyForm })
    setErrors({})
    setApiError('')
    setModalOpen(true)
  }

  const openEditModal = (lead) => {
    setEditingLead(lead)

    setForm({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      company: lead.company || '',
      phone: lead.phone || '',
      source: lead.source || 'OTHER',
      status: lead.status || 'NEW',
    })

    setErrors({})
    setApiError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingLead(null)
    setForm({ ...emptyForm })
    setErrors({})
  }

  const updateForm = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required.'
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required.'
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = 'Enter a valid email address.'
    }

    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      source: form.source,
      status: form.status,
    }

    try {
      setSaving(true)
      setApiError('')

      if (editingLead) {
        await api.patch(
          API_ENDPOINTS.LEADS.DETAIL(editingLead.id),
          payload
        )
      } else {
        await api.post(
          API_ENDPOINTS.LEADS.LIST,
          payload
        )
      }

      closeModal()
      setCurrentPage(1)

      // Reload the list after saving.
      if (currentPage === 1) {
        await fetchLeads()
      }
    } catch (error) {
      console.error('Lead save failed:', error)
      setApiError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lead?'
    )

    if (!confirmed) return

    try {
      setApiError('')

      await api.delete(
        API_ENDPOINTS.LEADS.DETAIL(id)
      )

      await fetchLeads()
    } catch (error) {
      console.error('Lead deletion failed:', error)
      setApiError(getErrorMessage(error))
    }
  }

  const handleConvert = async (lead) => {
    if (lead.status !== 'QUALIFIED') {
      setApiError('Only qualified leads can be converted.')
      return
    }

    const confirmed = window.confirm(
      `Convert ${lead.name} into a customer?`
    )

    if (!confirmed) return

    try {
      setApiError('')

      await api.post(
        API_ENDPOINTS.LEADS.CONVERT(lead.id)
      )

      setSelectedLead(null)
      await fetchLeads()
    } catch (error) {
      console.error('Lead conversion failed:', error)
      setApiError(getErrorMessage(error))
    }
  }

  const updateSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const updateFilter = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track potential customers and manage your sales pipeline.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Lead
          </button>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <p>{apiError}</p>
          <button
            type="button"
            onClick={() => setApiError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Leads"
          value={totalCount}
          description="All registered leads"
          icon={UserRoundPlus}
          color="text-blue-600 bg-blue-50"
        />

        <SummaryCard
          title="Active Leads"
          value={activeLeads}
          description="Not yet converted"
          icon={TrendingUp}
          color="text-amber-600 bg-amber-50"
        />

        <SummaryCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          description={`${convertedLeads} converted on this page`}
          icon={CheckCircle}
          color="text-green-600 bg-green-50"
        />
      </div>

      {/* Leads table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Search and filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search leads..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => updateFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
            aria-label="Filter leads by status"
          >
            <option value="All">All statuses</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4 font-semibold">Lead</th>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold">Source</th>
                <th className="px-5 py-4 font-semibold">Assigned To</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <UserRoundPlus
                      size={30}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      No leads found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or filters, or add a lead.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {lead.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lead.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.company || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {sourceLabels[lead.source] || lead.source || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.assignedTo}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          label="View lead"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye size={17} />
                        </ActionButton>

                        <ActionButton
                          label="Edit lead"
                          onClick={() => openEditModal(lead)}
                        >
                          <Pencil size={17} />
                        </ActionButton>

                        {lead.status === 'QUALIFIED' && (
                          <ActionButton
                            label="Convert lead"
                            onClick={() => handleConvert(lead)}
                            success
                          >
                            <CheckCircle size={17} />
                          </ActionButton>
                        )}

                        <ActionButton
                          label="Delete lead"
                          onClick={() => handleDelete(lead.id)}
                          danger
                        >
                          <Trash2 size={17} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {' '}to {Math.min(currentPage * pageSize, totalCount)}
            {' '}of {totalCount} leads
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LeadField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={updateForm}
                  error={errors.first_name}
                  required
                />

                <LeadField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={updateForm}
                  error={errors.last_name}
                  required
                />
              </div>

              <LeadField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                error={errors.email}
                required
              />

              <LeadField
                label="Company"
                name="company"
                value={form.company}
                onChange={updateForm}
              />

              <LeadField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={updateForm}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LeadSelect
                  label="Lead Source"
                  name="source"
                  value={form.source}
                  onChange={updateForm}
                  options={sources}
                  labels={sourceLabels}
                />

                <LeadSelect
                  label="Lead Status"
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  options={statuses}
                  labels={statusLabels}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingLead
                      ? 'Save Changes'
                      : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead details modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Lead Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close lead details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries({
                Name: selectedLead.name,
                Email: selectedLead.email,
                Company: selectedLead.company || '—',
                Phone: selectedLead.phone || '—',
                Source:
                  sourceLabels[selectedLead.source] ||
                  selectedLead.source ||
                  '—',
                Status:
                  statusLabels[selectedLead.status] ||
                  selectedLead.status,
                'Assigned To': selectedLead.assignedTo,
              }).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-700">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {selectedLead.status === 'QUALIFIED' && (
              <button
                type="button"
                onClick={() => handleConvert(selectedLead)}
                className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Convert to Customer
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-800">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    NEW: 'bg-blue-50 text-blue-700',
    CONTACTED: 'bg-purple-50 text-purple-700',
    QUALIFIED: 'bg-green-50 text-green-700',
    UNQUALIFIED: 'bg-red-50 text-red-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  )
}

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
  success = false,
}) {
  let style = 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'

  if (danger) {
    style = 'text-red-500 hover:bg-red-50'
  } else if (success) {
    style = 'text-green-600 hover:bg-green-50'
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${style}`}
    >
      {children}
    </button>
  )
}

function LeadField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-slate-200 focus:border-blue-500'
        }`}
      />

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function LeadSelect({
  label,
  name,
  value,
  onChange,
  options,
  labels,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Leads
