
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react'

import api from '../../services/api'
import API_ENDPOINTS from '../../services/endpoints'
import { useSettings } from '../../context/SettingsContext'
import { formatDate } from '../../utils/date'

const emptyForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'SALES_EMPLOYEE',
  department: 'Sales',
  is_active: true,
  password: '',
}

const roleLabels = {
  ADMIN: 'Administrator',
  SALES_MANAGER: 'Sales Manager',
  SALES_EMPLOYEE: 'Sales Employee',
}

const roleStyles = {
  ADMIN: 'bg-purple-50 text-purple-700',
  SALES_MANAGER: 'bg-blue-50 text-blue-700',
  SALES_EMPLOYEE: 'bg-slate-100 text-slate-700',
}

const inputClass = (error = false) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
    error ? 'border-red-500' : 'border-slate-200'
  }`

const getErrorMessage = (error) => {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return data.detail

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(', ')
          : String(value)
        return `${key}: ${message}`
      })
      .join('\n')
  }

  return error?.message || 'Something went wrong. Please try again.'
}

const getInitials = (user) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()

  return name
    ? name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : (user.username || '?').slice(0, 2).toUpperCase()
}

const getFullName = (user) => {
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username ||
    'Unnamed user'
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

function ActionButton({
  children,
  onClick,
  title,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
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
    <div className="space-y-1.5">
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
        <p className="break-all text-sm font-medium text-slate-700">
          {value || 'Not provided'}
        </p>
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

export default function Users() {
  const { settings } = useSettings()
  const dateFormat = settings.dateFormat || 'DD/MM/YYYY'

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [modal, setModal] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const response = await api.get(API_ENDPOINTS.USERS.LIST)

      const data = response.data
      const users = Array.isArray(data) ? data : data?.results

      if (!Array.isArray(users)) {
        throw new Error('The users API returned an unexpected response format.')
      }

      setMembers(users)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const activeCount = members.filter((member) => member.is_active).length
  const inactiveCount = members.length - activeCount
  const adminCount = members.filter(
    (member) => member.role === 'ADMIN'
  ).length

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return members.filter((member) => {
      const name = getFullName(member).toLowerCase()

      const matchesSearch =
        !query ||
        name.includes(query) ||
        (member.username || '').toLowerCase().includes(query) ||
        (member.email || '').toLowerCase().includes(query)

      const matchesRole =
        roleFilter === 'All' || member.role === roleFilter

      const status = member.is_active ? 'Active' : 'Inactive'
      const matchesStatus =
        statusFilter === 'All' || status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, search, roleFilter, statusFilter])

  const closeModal = () => {
    if (saving) return

    setModal(null)
    setSelectedMember(null)
    setErrors({})
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const openAddModal = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setErrors({})
    setSuccessMessage('')
    setModal('form')
  }

  const openEditModal = (member) => {
    setForm({
      username: member.username || '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'SALES_EMPLOYEE',
      department: member.department || '',
      is_active: Boolean(member.is_active),
      password: '',
    })

    setEditingId(member.id)
    setErrors({})
    setSuccessMessage('')
    setModal('form')
  }

  const openDetails = (member) => {
    setSelectedMember(member)
    setModal('details')
  }

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
      general: '',
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.username.trim()) {
      newErrors.username = 'Username is required.'
    } else if (!/^[\w.@+-]+$/.test(form.username.trim())) {
      newErrors.username = 'Use letters, numbers and @ . + - _ only.'
    }

    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required.'
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required.'
    }

    const email = form.email.trim().toLowerCase()

    if (!email) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.'
    }

    if (
      form.phone.trim() &&
      !/^\+?[0-9\s()-]{7,20}$/.test(form.phone.trim())
    ) {
      newErrors.phone = 'Enter a valid phone number.'
    }

    if (!editingId && !form.password) {
      newErrors.password = 'Password is required for a new user.'
    } else if (form.password && form.password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.'
    }

    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    setErrors({})

    const payload = {
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      department: form.department.trim(),
      is_active: form.is_active,
    }

    if (form.password) {
      payload.password = form.password
    }

    try {
      if (editingId) {
        await api.patch(
          API_ENDPOINTS.USERS.DETAIL(editingId),
          payload
        )
        setSuccessMessage('User updated successfully.')
      } else {
        await api.post(API_ENDPOINTS.USERS.LIST, payload)
        setSuccessMessage('User created successfully.')
      }

      setModal(null)
      setSelectedMember(null)
      setEditingId(null)
      setForm({ ...emptyForm })

      await loadMembers()
    } catch (error) {
      setErrors({ general: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (member) => {
    const nextStatus = !member.is_active
    const action = nextStatus ? 'activate' : 'deactivate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${getFullName(member)}?`
      )
    ) {
      return
    }

    setActionId(member.id)
    setPageError('')
    setSuccessMessage('')

    try {
      await api.patch(
        API_ENDPOINTS.USERS.DETAIL(member.id),
        { is_active: nextStatus }
      )

      setSuccessMessage(
        `User ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      )

      if (selectedMember?.id === member.id) {
        setSelectedMember((previous) => ({
          ...previous,
          is_active: nextStatus,
        }))
      }

      await loadMembers()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  const deleteMember = async (member) => {
    const confirmed = window.confirm(
      `Permanently delete ${getFullName(member)}? This action cannot be undone.`
    )

    if (!confirmed) return

    setActionId(member.id)
    setPageError('')
    setSuccessMessage('')

    try {
      await api.delete(API_ENDPOINTS.USERS.DETAIL(member.id))

      setSelectedMember(null)
      setModal(null)
      setSuccessMessage('User deleted successfully.')

      await loadMembers()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Team Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage users, roles and account status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadMembers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Team Member
          </button>
        </div>
      </div>

      {pageError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="whitespace-pre-wrap">{pageError}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

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
          value={adminCount}
          icon={ShieldCheck}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search name, username or email..."
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
            <option value="ADMIN">Administrator</option>
            <option value="SALES_MANAGER">Sales Manager</option>
            <option value="SALES_EMPLOYEE">Sales Employee</option>
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

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
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
                          {getInitials(member)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {getFullName(member)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {member.email}
                          </p>
                          <p className="text-xs text-slate-400">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleStyles[member.role] || 'bg-slate-100 text-slate-700'}`}>
                        {roleLabels[member.role] || member.role}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {member.department || '—'}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(member.date_joined, dateFormat)}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        member.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
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
                          title={member.is_active ? 'Deactivate member' : 'Activate member'}
                          disabled={actionId === member.id}
                          onClick={() => toggleStatus(member)}
                        >
                          {member.is_active
                            ? <UserX size={17} />
                            : <UserCheck size={17} />}
                        </ActionButton>

                        <ActionButton
                          title="Delete member"
                          danger
                          disabled={actionId === member.id}
                          onClick={() => deleteMember(member)}
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
                      {members.length === 0
                        ? 'No users have been created yet.'
                        : 'No team members match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <Modal
          title={editingId ? 'Edit Team Member' : 'Add Team Member'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Username" error={errors.username} required>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleFormChange}
                  placeholder="Enter username"
                  autoComplete="username"
                  className={inputClass(Boolean(errors.username))}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email} required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Enter email"
                  autoComplete="email"
                  className={inputClass(Boolean(errors.email))}
                />
              </FormField>

              <FormField label="First Name" error={errors.first_name} required>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleFormChange}
                  placeholder="First name"
                  className={inputClass(Boolean(errors.first_name))}
                />
              </FormField>

              <FormField label="Last Name" error={errors.last_name} required>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleFormChange}
                  placeholder="Last name"
                  className={inputClass(Boolean(errors.last_name))}
                />
              </FormField>

              <FormField label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="Phone number"
                  className={inputClass(Boolean(errors.phone))}
                />
              </FormField>

              <FormField label="Department">
                <input
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  placeholder="Department"
                  className={inputClass()}
                />
              </FormField>
            </div>

            <FormField label="Role" required>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className={inputClass()}
              >
                <option value="ADMIN">Administrator</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_EMPLOYEE">Sales Employee</option>
              </select>
            </FormField>

            <FormField
              label={editingId ? 'New Password (optional)' : 'Password'}
              error={errors.password}
              required={!editingId}
            >
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder={editingId ? 'Leave blank to keep current password' : 'Create a password'}
                  autoComplete="new-password"
                  className={`${inputClass(Boolean(errors.password))} pl-10`}
                />
              </div>
              <p className="text-xs text-slate-400">
                Password must meet your Django password validation rules.
              </p>
            </FormField>

            {editingId && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Account is active
              </label>
            )}

            {errors.general && (
              <div className="whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.general}
              </div>
            )}

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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'details' && selectedMember && (
        <Modal title="Team Member Details" onClose={closeModal}>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {getInitials(selectedMember)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {getFullName(selectedMember)}
                </h3>
                <p className="text-sm text-slate-500">
                  {roleLabels[selectedMember.role] || selectedMember.role}
                </p>
              </div>
            </div>

            <DetailRow icon={UsersIcon} label="Username" value={selectedMember.username} />
            <DetailRow icon={Mail} label="Email" value={selectedMember.email} />
            <DetailRow icon={Phone} label="Phone" value={selectedMember.phone} />
            <DetailRow icon={ShieldCheck} label="Role" value={roleLabels[selectedMember.role]} />
            <DetailRow icon={BriefcaseBusiness} label="Department" value={selectedMember.department} />
            <DetailRow
              icon={CalendarDays}
              label="Joined"
              value={formatDate(selectedMember.date_joined, dateFormat)}
            />

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Account Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedMember.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {selectedMember.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => toggleStatus(selectedMember)}
                disabled={actionId === selectedMember.id}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {selectedMember.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <button
                type="button"
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
