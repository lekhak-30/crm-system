
import { useMemo, useState } from 'react'
import { isRequired, isValidEmail, isValidPhone } from '../../utils/validators'
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
} from 'lucide-react'

const initialLeads = [
  {
    id: 1,
    name: 'Robert Wilson',
    email: 'robert@example.com',
    company: 'Wilson Technologies',
    phone: '+1 202 555 0201',
    source: 'Website',
    status: 'New',
    assignedTo: 'Admin User',
    value: 5000,
  },
  {
    id: 2,
    name: 'Jennifer Taylor',
    email: 'jennifer@example.com',
    company: 'Taylor Solutions',
    phone: '+1 202 555 0202',
    source: 'Referral',
    status: 'Contacted',
    assignedTo: 'Sales Employee',
    value: 8500,
  },
  {
    id: 3,
    name: 'Daniel Thomas',
    email: 'daniel@example.com',
    company: 'Thomas Group',
    phone: '+1 202 555 0203',
    source: 'Social Media',
    status: 'Qualified',
    assignedTo: 'Sales Employee',
    value: 12000,
  },
  {
    id: 4,
    name: 'Sophia Martinez',
    email: 'sophia@example.com',
    company: 'Martinez Digital',
    phone: '+1 202 555 0204',
    source: 'Website',
    status: 'Proposal',
    assignedTo: 'Admin User',
    value: 15000,
  },
  {
    id: 5,
    name: 'William Garcia',
    email: 'william@example.com',
    company: 'Garcia Enterprises',
    phone: '+1 202 555 0205',
    source: 'Referral',
    status: 'Converted',
    assignedTo: 'Sales Employee',
    value: 10000,
  },
  {
    id: 6,
    name: 'Isabella Moore',
    email: 'isabella@example.com',
    company: 'Moore Consulting',
    phone: '+1 202 555 0206',
    source: 'Other',
    status: 'Lost',
    assignedTo: 'Admin User',
    value: 4000,
  },
]

const statuses = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Converted',
  'Lost',
]

const emptyForm = {
  name: '',
  email: '',
  company: '',
  phone: '',
  source: 'Website',
  status: 'New',
  assignedTo: 'Admin User',
  value: '',
}

function Leads() {
  const [leads, setLeads] = useState(initialLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 5

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.toLowerCase()

      const matchesSearch =
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeads.length / pageSize)
  )

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalValue = leads
    .filter((lead) => !['Converted', 'Lost'].includes(lead.status))
    .reduce((total, lead) => total + Number(lead.value || 0), 0)

  const openAddModal = () => {
    setEditingLead(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (lead) => {
    setEditingLead(lead)
    setForm({ ...lead, value: String(lead.value) })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingLead(null)
    setForm(emptyForm)
    setErrors({})
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = {}

    if (!isRequired(form.name)) {
      validationErrors.name = 'Lead name is required'
    }

    if (!isRequired(form.email)) {
      validationErrors.email = 'Email address is required'
    } else if (!isValidEmail(form.email)) {
      validationErrors.email = 'Enter a valid email address'
    }

    if (!isRequired(form.company)) {
      validationErrors.company = 'Company name is required'
    }

    if (!isRequired(form.phone)) {
      validationErrors.phone = 'Phone number is required'
    } else if (!isValidPhone(form.phone)) {
      validationErrors.phone = 'Enter a valid phone number'
    }

    const numericValue = Number(form.value)
    if (!isRequired(form.value)) {
      validationErrors.value = 'Estimated value is required'
    } else if (!Number.isFinite(numericValue) || numericValue < 0) {
      validationErrors.value = 'Enter a valid non-negative amount'
    }

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (editingLead) {
      setLeads((previous) =>
        previous.map((lead) =>
          lead.id === editingLead.id
            ? { ...lead, ...form, value: numericValue }
            : lead
        )
      )
    } else {
      const newLead = {
        ...form,
        id: Math.max(0, ...leads.map((lead) => lead.id)) + 1,
        value: numericValue,
      }

      setLeads((previous) => [newLead, ...previous])
      setCurrentPage(1)
    }

    closeModal()
  }

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return
    }

    setLeads((previous) =>
      previous.filter((lead) => lead.id !== id)
    )
  }

  const handleConvert = (lead) => {
    if (!window.confirm(`Convert ${lead.name} into a customer?`)) {
      return
    }

    setLeads((previous) =>
      previous.map((item) =>
        item.id === lead.id
          ? { ...item, status: 'Converted' }
          : item
      )
    )
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

  const updateSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const updateFilter = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const activeLeads = leads.filter(
    (lead) => !['Converted', 'Lost'].includes(lead.status)
  ).length

  const convertedLeads = leads.filter(
    (lead) => lead.status === 'Converted'
  ).length

  const conversionRate = leads.length
    ? Math.round((convertedLeads / leads.length) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track potential customers and manage your sales opportunities.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Lead
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Leads"
          value={leads.length}
          description="All registered leads"
          icon={UserRoundPlus}
          color="text-blue-600 bg-blue-50"
        />

        <SummaryCard
          title="Active Leads"
          value={activeLeads}
          description="Currently in sales pipeline"
          icon={TrendingUp}
          color="text-amber-600 bg-amber-50"
        />

        <SummaryCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          description={`${convertedLeads} converted leads`}
          icon={CheckCircle}
          color="text-green-600 bg-green-50"
        />
      </div>

      {/* Pipeline value */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-medium text-blue-700">
          Active Pipeline Value
        </p>
        <p className="mt-2 text-2xl font-bold text-blue-900">
          ${totalValue.toLocaleString('en-US')}
        </p>
        <p className="mt-1 text-xs text-blue-600">
          Estimated value of leads not yet converted or lost
        </p>
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
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4 font-semibold">Lead</th>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold">Source</th>
                <th className="px-5 py-4 font-semibold">Assigned To</th>
                <th className="px-5 py-4 font-semibold">Value</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.map((lead) => (
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
                    {lead.company}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {lead.source}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {lead.assignedTo}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-700">
                    ${Number(lead.value).toLocaleString('en-US')}
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

                      {!['Converted', 'Lost'].includes(lead.status) && (
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
              ))}

              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <UserRoundPlus
                      size={30}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      No leads found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {' '}to {Math.min(currentPage * pageSize, filteredLeads.length)}
            {' '}of {filteredLeads.length} leads
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <LeadField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={updateForm}
                error={errors.name}
                required
              />

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
                error={errors.company}
                required
              />

              <LeadField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={updateForm}
                error={errors.phone}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LeadSelect
                  label="Lead Source"
                  name="source"
                  value={form.source}
                  onChange={updateForm}
                  options={['Website', 'Referral', 'Social Media', 'Other']}
                />

                <LeadSelect
                  label="Lead Status"
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  options={statuses}
                />

                <LeadSelect
                  label="Assigned To"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={updateForm}
                  options={['Admin User', 'Sales Employee']}
                />

                <LeadField
                  label="Estimated Value ($)"
                  name="value"
                  type="number"
                  value={form.value}
                  onChange={updateForm}
                error={errors.value}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingLead ? 'Save Changes' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead details modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Lead Details
              </h2>

              <button
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
                Company: selectedLead.company,
                Phone: selectedLead.phone,
                Source: selectedLead.source,
                Status: selectedLead.status,
                'Assigned To': selectedLead.assignedTo,
                'Estimated Value': `$${Number(selectedLead.value).toLocaleString('en-US')}`,
              }).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedLead(null)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Lead records are illustrative sample data stored in local React state.
        Conversion currently updates the lead status only.
      </p>
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
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    New: 'bg-blue-50 text-blue-700',
    Contacted: 'bg-purple-50 text-purple-700',
    Qualified: 'bg-green-50 text-green-700',
    Proposal: 'bg-amber-50 text-amber-700',
    Converted: 'bg-emerald-100 text-emerald-700',
    Lost: 'bg-red-50 text-red-700',
  }

  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
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
      </label>

      <input
        id={name}
        name={name}
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
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
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function LeadSelect({ label, name, value, onChange, options }) {
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
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Leads
