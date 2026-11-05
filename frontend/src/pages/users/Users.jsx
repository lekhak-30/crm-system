
import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Users as UsersIcon,
  UserCheck,
  UserX,
  ShieldCheck,
  Pencil,
  Trash2,
  Eye,
  X,
  Mail,
  Phone,
  CalendarDays,
  BriefcaseBusiness,
} from 'lucide-react'

const initialMembers = [
  {
    id: 1,
    name: 'Alex Morgan',
    email: 'alex@company.com',
    phone: '+1 555 0101',
    role: 'Administrator',
    department: 'Management',
    status: 'Active',
    joined: '2025-01-15',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    phone: '+1 555 0102',
    role: 'Sales Manager',
    department: 'Sales',
    status: 'Active',
    joined: '2025-03-20',
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael@company.com',
    phone: '+1 555 0103',
    role: 'Sales Employee',
    department: 'Sales',
    status: 'Active',
    joined: '2025-05-10',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@company.com',
    phone: '+1 555 0104',
    role: 'Sales Employee',
    department: 'Sales',
    status: 'Inactive',
    joined: '2025-06-12',
  },
  {
    id: 5,
    name: 'David Wilson',
    email: 'david@company.com',
    phone: '+1 555 0105',
    role: 'Sales Manager',
    department: 'Sales',
    status: 'Active',
    joined: '2025-08-01',
  },
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'Sales Employee',
  department: 'Sales',
  status: 'Active',
}

const roleStyles = {
  Administrator: 'bg-purple-50 text-purple-700',
  'Sales Manager': 'bg-blue-50 text-blue-700',
  'Sales Employee': 'bg-slate-100 text-slate-700',
}

function Users() {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  const activeCount = members.filter(
    (member) => member.status === 'Active'
  ).length

  const inactiveCount = members.length - activeCount

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const query = search.toLowerCase()

      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)

      const matchesRole =
        roleFilter === 'All' || member.role === roleFilter

      const matchesStatus =
        statusFilter === 'All' || member.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, search, roleFilter, statusFilter])

  const openAddModal = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setErrors({})
    setModal('form')
  }

  const openEditModal = (member) => {
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      department: member.department,
      status: member.status,
    })

    setEditingId(member.id)
    setErrors({})
    setModal('form')
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
      general: '',
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    const trimmedName = form.name.trim()
    const normalizedEmail = form.email.trim().toLowerCase()
    const trimmedPhone = form.phone.trim()

    // Name validation
    if (!trimmedName) {
      newErrors.name = 'Full name is required.'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must contain at least 2 characters.'
    } else if (!/^[\p{L}\s'-]+$/u.test(trimmedName)) {
      newErrors.name = 'Name contains invalid characters.'
    }

    // Email validation
    if (!normalizedEmail) {
      newErrors.email = 'Email address is required.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      newErrors.email = 'Enter a valid email address.'
    } else {
      const emailExists = members.some(
        (member) =>
          member.email.toLowerCase() === normalizedEmail &&
          member.id !== editingId
      )

      if (emailExists) {
        newErrors.email = 'This email is already registered.'
      }
    }

    // Phone validation (optional field)
    if (
      trimmedPhone &&
      !/^\+?[0-9\s()-]{7,20}$/.test(trimmedPhone)
    ) {
      newErrors.phone = 'Enter a valid phone number.'
    }

    return newErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    }

    if (editingId) {
      setMembers((previous) =>
        previous.map((member) =>
          member.id === editingId
            ? {
                ...member,
                ...normalizedForm,
              }
            : member
        )
      )

      if (selectedMember?.id === editingId) {
        setSelectedMember((previous) => ({
          ...previous,
          ...normalizedForm,
        }))
      }
    } else {
      const newMember = {
        ...normalizedForm,
        id: Date.now(),
        joined: new Date().toISOString().slice(0, 10),
      }

      setMembers((previous) => [newMember, ...previous])
    }

    closeModal()
  }

  const toggleStatus = (id) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === id
          ? {
              ...member,
              status: member.status === 'Active' ? 'Inactive' : 'Active',
            }
          : member
      )
    )

    if (selectedMember?.id === id) {
      setSelectedMember((previous) => ({
        ...previous,
        status: previous.status === 'Active' ? 'Inactive' : 'Active',
      }))
    }
  }

  const deleteMember = (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this team member?'
    )

    if (!confirmed) return

    setMembers((previous) =>
      previous.filter((member) => member.id !== id)
    )

    setSelectedMember(null)
    setModal(null)
  }

  const openDetails = (member) => {
    setSelectedMember(member)
    setModal('details')
  }

  const closeModal = () => {
    setModal(null)
    setSelectedMember(null)
    setErrors({})
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Team Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your team, roles and account status.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Members"
          value={members.length}
          icon={UsersIcon}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Members"
          value={activeCount}
          icon={UserCheck}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive Members"
          value={inactiveCount}
          icon={UserX}
          color="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          title="Administrators"
          value={members.filter(
            (member) => member.role === 'Administrator'
          ).length}
          icon={ShieldCheck}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Sales Manager">Sales Manager</option>
            <option value="Sales Employee">Sales Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

        </div>
      </div>

      {/* Members table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              All Team Members
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {filteredMembers.length} member(s) found
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Member</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {member.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>

                      <div>
                        <p className="font-medium text-slate-800">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleStyles[member.role]}`}>
                      {member.role}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {member.department}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {new Date(`${member.joined}T00:00:00`).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      member.status === 'Active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {member.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <ActionButton
                        title="View details"
                        onClick={() => openDetails(member)}
                      >
                        <Eye size={17} />
                      </ActionButton>

                      <ActionButton
                        title="Edit member"
                        onClick={() => openEditModal(member)}
                      >
                        <Pencil size={17} />
                      </ActionButton>

                      <ActionButton
                        title={member.status === 'Active' ? 'Deactivate member' : 'Activate member'}
                        onClick={() => toggleStatus(member.id)}
                      >
                        {member.status === 'Active'
                          ? <UserX size={17} />
                          : <UserCheck size={17} />}
                      </ActionButton>

                      <ActionButton
                        title="Delete member"
                        danger
                        onClick={() => deleteMember(member.id)}
                      >
                        <Trash2 size={17} />
                      </ActionButton>
                    </div>
                  </td>

                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    No team members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal === 'form' && (
        <Modal
          title={editingId ? 'Edit Team Member' : 'Add Team Member'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <FormField
              label="Full Name"
              error={errors.name}
              required
            >
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Enter full name"
                aria-invalid={Boolean(errors.name)}
                className={inputClass(errors.name)}
              />
            </FormField>

            <FormField
              label="Email Address"
              error={errors.email}
              required
            >
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="Enter email address"
                aria-invalid={Boolean(errors.email)}
                className={inputClass(errors.email)}
              />
            </FormField>

            <FormField
              label="Phone Number"
              error={errors.phone}
            >
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
                aria-invalid={Boolean(errors.phone)}
                className={inputClass(errors.phone)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Role">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option>Administrator</option>
                  <option>Sales Manager</option>
                  <option>Sales Employee</option>
                </select>
              </FormField>

              <FormField label="Department">
                <select
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option>Management</option>
                  <option>Sales</option>
                  <option>Marketing</option>
                  <option>Support</option>
                </select>
              </FormField>
            </div>

            <FormField label="Account Status">
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className="form-input"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </FormField>

            {errors.general && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.general}
              </p>
            )}

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
                {editingId ? 'Save Changes' : 'Add Member'}
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* Member details modal */}
      {modal === 'details' && selectedMember && (
        <Modal title="Team Member Details" onClose={closeModal}>
          <div className="space-y-5">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {selectedMember.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {selectedMember.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedMember.role}
                </p>
              </div>
            </div>

            <DetailRow icon={Mail} label="Email" value={selectedMember.email} />
            <DetailRow icon={Phone} label="Phone" value={selectedMember.phone || 'Not provided'} />
            <DetailRow icon={ShieldCheck} label="Role" value={selectedMember.role} />
            <DetailRow icon={BriefcaseBusiness} label="Department" value={selectedMember.department} />
            <DetailRow icon={CalendarDays} label="Joined" value={new Date(`${selectedMember.joined}T00:00:00`).toLocaleDateString()} />

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Account Status</span>

              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedMember.status === 'Active'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {selectedMember.status}
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => toggleStatus(selectedMember.id)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                {selectedMember.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => openEditModal(selectedMember)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit Member
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
    error
      ? 'border-red-500 focus:border-red-500'
      : 'border-slate-200'
  }`
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

function ActionButton({ children, onClick, title, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
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

function FormField({ label, children, error, required = false }) {
  return (
    <div className="block space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="break-all text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Users
