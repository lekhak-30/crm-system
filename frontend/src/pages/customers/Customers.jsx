
import { useMemo, useState } from 'react'
import { validateCustomer } from '../../utils/validators'
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

const initialCustomers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Tech Solutions',
    phone: '+1 202 555 0101',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    company: 'Digital Works',
    phone: '+1 202 555 0102',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael@example.com',
    company: 'Global Systems',
    phone: '+1 202 555 0103',
    status: 'Pending',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@example.com',
    company: 'Creative Studio',
    phone: '+1 202 555 0104',
    status: 'Active',
  },
  {
    id: 5,
    name: 'David Wilson',
    email: 'david@example.com',
    company: 'Wilson Enterprises',
    phone: '+1 202 555 0105',
    status: 'Inactive',
  },
  {
    id: 6,
    name: 'Olivia Martin',
    email: 'olivia@example.com',
    company: 'Martin Group',
    phone: '+1 202 555 0106',
    status: 'Active',
  },
  {
    id: 7,
    name: 'James Anderson',
    email: 'james@example.com',
    company: 'Anderson Tech',
    phone: '+1 202 555 0107',
    status: 'Pending',
  },
]

const emptyForm = {
  name: '',
  email: '',
  company: '',
  phone: '',
  status: 'Active',
}

function Customers() {
  const [customers, setCustomers] = useState(initialCustomers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const pageSize = 5

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = search.toLowerCase()

      const matchesSearch =
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.company.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || customer.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [customers, search, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  )

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const openAddModal = () => {
    setEditingCustomer(null)
    setForm(emptyForm)
    setModalOpen(true)
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      email: customer.email,
      company: customer.company,
      phone: customer.phone,
      status: customer.status,
    })
    setModalOpen(true)
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCustomer(null)
    setForm(emptyForm)
    setErrors({})
  }

  const handleSubmit = (event) => {
  event.preventDefault()

  const validationErrors = validateCustomer(form)
  setErrors(validationErrors)

  if (Object.keys(validationErrors).length > 0) {
    return
  }

  if (editingCustomer) {
    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === editingCustomer.id
          ? { ...customer, ...form }
          : customer
      )
    )
  } else {
    const newCustomer = {
      id: Math.max(0, ...customers.map((customer) => customer.id)) + 1,
      ...form,
    }

    setCustomers((previous) => [newCustomer, ...previous])
    setCurrentPage(1)
  }

  closeModal()
}

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer?'
    )

    if (!confirmed) return

    setCustomers((previous) =>
      previous.filter((customer) => customer.id !== id)
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

  const changeSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const changeFilter = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const activeCount = customers.filter(
    (customer) => customer.status === 'Active'
  ).length

  const pendingCount = customers.filter(
    (customer) => customer.status === 'Pending'
  ).length

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
          value={customers.length}
          description="All customer records"
        />
        <SummaryCard
          title="Active Customers"
          value={activeCount}
          description="Currently active"
        />
        <SummaryCard
          title="Pending Customers"
          value={pendingCount}
          description="Awaiting confirmation"
        />
      </div>

      {/* Customer table */}
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
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => changeFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
            aria-label="Filter customers by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

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
              {paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {customer.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {customer.email}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {customer.company}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {customer.phone}
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

              {paginatedCustomers.length === 0 && (
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
            Showing {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {' '}to{' '}
            {Math.min(currentPage * pageSize, filteredCustomers.length)}
            {' '}of {filteredCustomers.length} customers
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <FormField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="Enter customer name"
                required
                error={errors.name}
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="Enter email address"
                required
                error={errors.name}
              />

              <FormField
                label="Company"
                name="company"
                value={form.company}
                onChange={updateForm}
                placeholder="Enter company name"
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={updateForm}
                placeholder="Enter phone number"
                required
                error={errors.name}
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
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingCustomer ? 'Save Changes' : 'Add Customer'}
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
                Company: selectedCustomer.company,
                Phone: selectedCustomer.phone,
                Status: selectedCustomer.status,
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
    Pending: 'bg-amber-50 text-amber-700',
    Inactive: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
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
