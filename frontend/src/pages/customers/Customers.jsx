
import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'


import api from '../../services/api'
import API_ENDPOINTS from '../../services/endpoints'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  company: '',
  phone: '',
  status: 'ACTIVE',
}

const PAGE_SIZE = 10

function getCustomerName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
}

function normalizeCustomer(customer) {
  return {
    ...customer,
    name: getCustomerName(customer),
    status: customer.status === 'ACTIVE' ? 'Active' : 'Inactive',
  }
}

function getApiError(error) {
  const data = error.response?.data

  if (!data) return 'Unable to connect to the server. Please try again.'

  if (typeof data.detail === 'string') return data.detail

  if (typeof data === 'string') return data

  return 'Please check the submitted information and try again.'
}

function validateForm(form) {
  const errors = {}

  if (!form.first_name.trim()) errors.first_name = 'First name is required.'
  if (!form.last_name.trim()) errors.last_name = 'Last name is required.'

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

function Customers() {
  const [customers, setCustomers] = useState([])
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Fetch customers from Django whenever the page or search changes.
  useEffect(() => {
    const controller = new AbortController()

    async function fetchCustomers() {
      setLoading(true)
      setPageError('')

      try {
        const response = await api.get(API_ENDPOINTS.CUSTOMERS.LIST, {
          params: {
            page: currentPage,
            search: search.trim() || undefined,
          },
          signal: controller.signal,
        })

        setCustomers(response.data.results.map(normalizeCustomer))
        setTotalCount(response.data.count)
      } catch (error) {
        if (error.name === 'CanceledError') return

        setPageError(getApiError(error))
        setCustomers([])
        setTotalCount(0)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchCustomers()

    return () => controller.abort()
  }, [currentPage, search])

  const activeCount = customers.filter(
    (customer) => customer.status === 'Active'
  ).length

  const inactiveCount = customers.filter(
    (customer) => customer.status === 'Inactive'
  ).length

  const openAddModal = () => {
    setEditingCustomer(null)
    setForm(emptyForm)
    setErrors({})
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)

    setForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      company: customer.company || '',
      phone: customer.phone || '',
      status: customer.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
    })

    setErrors({})
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingCustomer(null)
    setForm(emptyForm)
    setErrors({})
    setFormError('')
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm(form)
    setErrors(validationErrors)
    setFormError('')

    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)

    try {
      const payload = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
      }

      if (editingCustomer) {
        await api.patch(
          API_ENDPOINTS.CUSTOMERS.DETAIL(editingCustomer.id),
          payload
        )
      } else {
        await api.post(API_ENDPOINTS.CUSTOMERS.LIST, payload)
      }

      setModalOpen(false)
      setEditingCustomer(null)
      setForm(emptyForm)
      setErrors({})

      // A new record should appear on the first page.
      if (!editingCustomer && currentPage !== 1) {
        setCurrentPage(1)
      } else {
        // Trigger a fresh request even when the page did not change.
        setCurrentPage((page) => page)
        window.dispatchEvent(new Event('crm:customers-updated'))
      }

      // Refresh the page after a successful write.
      const response = await api.get(API_ENDPOINTS.CUSTOMERS.LIST, {
        params: {
          page: !editingCustomer ? 1 : currentPage,
          search: search.trim() || undefined,
        },
      })

      setCustomers(response.data.results.map(normalizeCustomer))
      setTotalCount(response.data.count)
    } catch (error) {
      const data = error.response?.data

      if (data && typeof data === 'object' && !data.detail) {
        const fieldErrors = {}

        Object.entries(data).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages)
            ? messages.join(' ')
            : String(messages)
        })

        setErrors(fieldErrors)
      } else {
        setFormError(getApiError(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer?'
    )

    if (!confirmed) return

    try {
      await api.delete(API_ENDPOINTS.CUSTOMERS.DETAIL(id))

      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        const response = await api.get(API_ENDPOINTS.CUSTOMERS.LIST, {
          params: {
            page: currentPage,
            search: search.trim() || undefined,
          },
        })

        setCustomers(response.data.results.map(normalizeCustomer))
        setTotalCount(response.data.count)
      }

      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      window.alert(getApiError(error))
    }
  }

  const changeSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track your customer relationships.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Customers"
          value={totalCount}
          description="All customer records"
        />
        <SummaryCard
          title="Active on This Page"
          value={activeCount}
          description="Active records on current page"
        />
        <SummaryCard
          title="Inactive on This Page"
          value={inactiveCount}
          description="Inactive records on current page"
        />
      </div>

      {/* Customer table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Search */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <span className="text-xs text-slate-500">
            Search by name, email, phone or company
          </span>
        </div>

        {/* Error */}
        {pageError && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              )}

              {!loading && !pageError && customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {customer.name || '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {customer.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {customer.company || '—'}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {customer.phone || '—'}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={customer.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <ActionButton
                        label="View customer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye size={17} />
                      </ActionButton>

                      <ActionButton
                        label="Edit customer"
                        onClick={() => openEditModal(customer)}
                      >
                        <Pencil size={17} />
                      </ActionButton>

                      <ActionButton
                        label="Delete customer"
                        onClick={() => handleDelete(customer.id)}
                        danger
                      >
                        <Trash2 size={17} />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !pageError && customers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center">
                    <Users
                      size={30}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      No customers found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Add a customer or change your search.
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
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            {' '}to{' '}
            {Math.min(currentPage * PAGE_SIZE, totalCount)}
            {' '}of {totalCount} customers
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={updateForm}
                  placeholder="First name"
                  required
                  error={errors.first_name}
                />

                <FormField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={updateForm}
                  placeholder="Last name"
                  required
                  error={errors.last_name}
                />
              </div>

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="Enter email address"
                required
                error={errors.email}
              />

              <FormField
                label="Company"
                name="company"
                value={form.company}
                onChange={updateForm}
                placeholder="Enter company name"
                error={errors.company}
              />

              <FormField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={updateForm}
                placeholder="Enter phone number"
                error={errors.phone}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

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
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingCustomer
                      ? 'Save Changes'
                      : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer details modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Customer Details
              </h2>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close customer details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries({
                Name: selectedCustomer.name,
                Email: selectedCustomer.email,
                Company: selectedCustomer.company || '—',
                Phone: selectedCustomer.phone || '—',
                Status: selectedCustomer.status,
              }).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {value || '—'}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-green-50 text-green-700',
    Inactive: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || styles.Inactive}`}>
      {status}
    </span>
  )
}

function ActionButton({ children, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      {children}
    </button>
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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

export default Customers
