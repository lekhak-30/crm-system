
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Phone,
  CalendarDays,
  Mail,
  CheckSquare,
  Clock,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  ListTodo,
  RefreshCw,
  Eye,
} from 'lucide-react'
import api from '../../services/api'
import { useSettings } from '../../context/SettingsContext'
import { formatDate, formatDateTime } from '../../utils/date'

const ACTIVITY_URL = '/activities/'

const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Call' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TASK', label: 'Task' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
]

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const emptyForm = {
  subject: '',
  description: '',
  activity_type: 'CALL',
  priority: 'MEDIUM',
  status: 'PLANNED',
  due_at: '',
  customer: '',
  lead: '',
  opportunity: '',
}

function getList(response) {
  const data = response.data
  return Array.isArray(data) ? data : data?.results || []
}

function getErrorMessage(error) {
  const data = error.response?.data

  if (!data) {
    return error.message || 'Something went wrong.'
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(', ')
        : String(messages)

      return `${field}: ${message}`
    })
    .join('\n')
}

function toLocalDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16)
}

function isActivityOverdue(activity) {
  if (!['PLANNED', 'IN_PROGRESS'].includes(activity.status)) {
    return false
  }

  if (!activity.due_at) return false

  const dueTime = new Date(activity.due_at).getTime()

  return Number.isFinite(dueTime) && dueTime < Date.now()
}

function getRelatedName(activity) {
  return (
    activity.customer_name ||
    activity.lead_name ||
    activity.opportunity_name ||
    'Internal activity'
  )
}

function getTypeLabel(value) {
  return ACTIVITY_TYPES.find((type) => type.value === value)?.label || value
}

function getStatusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label || value
}

function getRecordName(record) {
  return (
    record.company_name ||
    record.name ||
    record.title ||
    [record.first_name, record.last_name].filter(Boolean).join(' ') ||
    `Record #${record.id}`
  )
}

function Activities() {
  const { settings } = useSettings()
  const dateFormat = settings.dateFormat || 'DD/MM/YYYY'

  const [activities, setActivities] = useState([])
  const [customers, setCustomers] = useState([])
  const [leads, setLeads] = useState([])
  const [opportunities, setOpportunities] = useState([])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)

  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        activityResponse,
        customerResponse,
        leadResponse,
        opportunityResponse,
      ] = await Promise.all([
        api.get(ACTIVITY_URL),
        api.get('/customers/'),
        api.get('/leads/'),
        api.get('/opportunities/'),
      ])

      setActivities(getList(activityResponse))
      setCustomers(getList(customerResponse))
      setLeads(getList(leadResponse))
      setOpportunities(getList(opportunityResponse))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase()

    return activities.filter((activity) => {
      const matchesSearch = [
        activity.subject,
        activity.description,
        getRelatedName(activity),
        activity.assigned_to_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))

      const matchesType =
        typeFilter === 'ALL' || activity.activity_type === typeFilter

      const matchesStatus =
        statusFilter === 'ALL' || activity.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [activities, search, typeFilter, statusFilter])

  const pendingCount = activities.filter(
    (activity) =>
      activity.status === 'PLANNED' ||
      activity.status === 'IN_PROGRESS'
  ).length

  const completedCount = activities.filter(
    (activity) => activity.status === 'COMPLETED'
  ).length

  const overdueCount = activities.filter(isActivityOverdue).length

  const openAddModal = () => {
    setEditingActivity(null)
    setForm({ ...emptyForm })
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (activity) => {
    setEditingActivity(activity)

    setForm({
      subject: activity.subject || '',
      description: activity.description || '',
      activity_type: activity.activity_type || 'CALL',
      priority: activity.priority || 'MEDIUM',
      status: activity.status || 'PLANNED',
      due_at: toLocalDateTime(activity.due_at),
      customer: activity.customer ? String(activity.customer) : '',
      lead: activity.lead ? String(activity.lead) : '',
      opportunity: activity.opportunity
        ? String(activity.opportunity)
        : '',
    })

    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingActivity(null)
    setForm({ ...emptyForm })
    setError('')
  }

  const updateForm = (event) => {
    const { name, value } = event.target

    setForm((previous) => {
      const updated = { ...previous, [name]: value }

      if (['customer', 'lead', 'opportunity'].includes(name) && value) {
        updated.customer = name === 'customer' ? value : ''
        updated.lead = name === 'lead' ? value : ''
        updated.opportunity = name === 'opportunity' ? value : ''
      }

      return updated
    })
  }

  const validateForm = () => {
    if (!form.subject.trim()) return 'Activity subject is required.'

    if (form.subject.trim().length < 3) {
      return 'Subject must contain at least 3 characters.'
    }

    if (!form.due_at) return 'Due date and time are required.'

    if (!form.customer && !form.lead && !form.opportunity) {
      return 'Select a customer, lead, or opportunity.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      subject: form.subject.trim(),
      description: form.description.trim(),
      activity_type: form.activity_type,
      priority: form.priority,
      status: form.status,
      due_at: new Date(form.due_at).toISOString(),
      customer: form.customer || null,
      lead: form.lead || null,
      opportunity: form.opportunity || null,
    }

    setSaving(true)
    setError('')

    try {
      if (editingActivity) {
        await api.patch(
          `${ACTIVITY_URL}${editingActivity.id}/`,
          payload
        )
      } else {
        await api.post(ACTIVITY_URL, payload)
      }

      setModalOpen(false)
      setEditingActivity(null)
      setForm({ ...emptyForm })

      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleCompletion = async (activity) => {
    if (activity.status === 'COMPLETED') {
      setError(
        'The backend completion action only completes activities. Reopening is not supported by this action.'
      )
      return
    }

    if (activity.status === 'CANCELLED') {
      setError('Cancelled activities cannot be completed.')
      return
    }

    try {
      setError('')

      await api.post(
        `${ACTIVITY_URL}${activity.id}/complete/`
      )

      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const deleteActivity = async (id) => {
    if (!window.confirm('Delete this activity permanently?')) return

    try {
      setError('')
      await api.delete(`${ACTIVITY_URL}${id}/`)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Activities & Follow-ups
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize calls, meetings, emails and sales tasks.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Activity
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="whitespace-pre-line">{error}</p>
          <button
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Pending Activities"
          value={pendingCount}
          icon={Clock}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Completed Activities"
          value={completedCount}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Overdue Activities"
          value={overdueCount}
          icon={ListTodo}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activities..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          aria-label="Filter by activity type"
        >
          <option value="ALL">All types</option>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          aria-label="Filter by activity status"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800">
            Activity Schedule
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredActivities.length} activities found
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading activities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ListTodo
              size={32}
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="text-sm font-medium text-slate-600">
              No activities found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try changing your search or filters, or add an activity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                dateFormat={dateFormat}
                onView={() => setSelectedActivity(activity)}
                onEdit={() => openEditModal(activity)}
                onDelete={() => deleteActivity(activity.id)}
                onToggle={() => toggleCompletion(activity)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
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
              <ActivityField
                label="Activity Subject"
                name="subject"
                value={form.subject}
                onChange={updateForm}
                required
              />

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ActivitySelect
                  label="Activity Type"
                  name="activity_type"
                  value={form.activity_type}
                  onChange={updateForm}
                  options={ACTIVITY_TYPES.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />

                <ActivitySelect
                  label="Priority"
                  name="priority"
                  value={form.priority}
                  onChange={updateForm}
                  options={PRIORITIES.map((value) => ({
                    value,
                    label: value,
                  }))}
                />

                <ActivitySelect
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  options={STATUSES.filter(
                    (item) => item.value !== 'COMPLETED'
                  ).map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />

                <ActivityField
                  label="Due Date & Time"
                  name="due_at"
                  type="datetime-local"
                  value={form.due_at}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">
                  Link to a CRM Record
                </h3>
                <p className="mb-3 text-xs text-slate-500">
                  Select one customer, lead, or opportunity.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ActivitySelect
                    label="Customer"
                    name="customer"
                    value={form.customer}
                    onChange={updateForm}
                    options={[
                      { value: '', label: 'No customer selected' },
                      ...customers.map((item) => ({
                        value: String(item.id),
                        label: getRecordName(item),
                      })),
                    ]}
                  />

                  <ActivitySelect
                    label="Lead"
                    name="lead"
                    value={form.lead}
                    onChange={updateForm}
                    options={[
                      { value: '', label: 'No lead selected' },
                      ...leads.map((item) => ({
                        value: String(item.id),
                        label: getRecordName(item),
                      })),
                    ]}
                  />

                  <ActivitySelect
                    label="Opportunity"
                    name="opportunity"
                    value={form.opportunity}
                    onChange={updateForm}
                    options={[
                      { value: '', label: 'No opportunity selected' },
                      ...opportunities.map((item) => ({
                        value: String(item.id),
                        label: getRecordName(item),
                      })),
                    ]}
                  />
                </div>
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
                    : editingActivity
                      ? 'Save Changes'
                      : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Activity Details
              </h2>

              <button
                onClick={() => setSelectedActivity(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Detail label="Subject" value={selectedActivity.subject} />
              <Detail
                label="Description"
                value={selectedActivity.description || 'No description'}
              />
              <Detail
                label="Type"
                value={getTypeLabel(selectedActivity.activity_type)}
              />
              <Detail
                label="Related Record"
                value={getRelatedName(selectedActivity)}
              />
              <Detail
                label="Assigned To"
                value={selectedActivity.assigned_to_name || 'Not assigned'}
              />
              <Detail
                label="Priority"
                value={selectedActivity.priority}
              />
              <Detail
                label="Due Date"
                value={
                  selectedActivity.due_at
                    ? formatDateTime(selectedActivity.due_at, dateFormat)
                    : 'Not set'
                }
              />
              <Detail
                label="Status"
                value={getStatusLabel(selectedActivity.status)}
              />
            </div>

            <button
              onClick={() => setSelectedActivity(null)}
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

function ActivityRow({
  activity,
  dateFormat,
  onView,
  onEdit,
  onDelete,
  onToggle,
}) {
  const typeIcons = {
    CALL: Phone,
    MEETING: CalendarDays,
    EMAIL: Mail,
    TASK: CheckSquare,
    FOLLOW_UP: Clock,
  }

  const Icon = typeIcons[activity.activity_type] || ListTodo

  const priorityStyles = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-red-50 text-red-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    LOW: 'bg-slate-100 text-slate-600',
  }

  const statusStyles = {
    COMPLETED: 'bg-green-50 text-green-700',
    PLANNED: 'bg-blue-50 text-blue-700',
    IN_PROGRESS: 'bg-amber-50 text-amber-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
  }

  const isOverdue = isActivityOverdue(activity)

  return (
    <div className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <button
            onClick={onView}
            className="text-left text-sm font-semibold text-slate-800 hover:text-blue-600"
          >
            {activity.subject}
          </button>

          <p className="mt-1 text-xs text-slate-500">
            {activity.description || 'No description'}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {getTypeLabel(activity.activity_type)} · {getRelatedName(activity)} ·{' '}
            {activity.assigned_to_name || 'Unassigned'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            priorityStyles[activity.priority] || priorityStyles.LOW
          }`}
        >
          {activity.priority}
        </span>

        <span
          className={`text-xs font-medium ${
            isOverdue ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {activity.due_at
            ? formatDate(activity.due_at, dateFormat)
            : 'No due date'}
          {isOverdue && ' · Overdue'}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            statusStyles[activity.status] || statusStyles.PLANNED
          }`}
        >
          {getStatusLabel(activity.status)}
        </span>

        <div className="flex gap-1">
          {activity.status !== 'COMPLETED' &&
            activity.status !== 'CANCELLED' && (
              <RowAction
                label="Complete activity"
                onClick={onToggle}
              >
                <CheckCircle size={17} />
              </RowAction>
            )}

          <RowAction label="View activity" onClick={onView}>
            <Eye size={17} />
          </RowAction>

          <RowAction label="Edit activity" onClick={onEdit}>
            <Pencil size={17} />
          </RowAction>

          <RowAction
            label="Delete activity"
            onClick={onDelete}
            danger
          >
            <Trash2 size={17} />
          </RowAction>
        </div>
      </div>
    </div>
  )
}

function RowAction({ children, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      {children}
    </button>
  )
}

function ActivityField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
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
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  )
}

function ActivitySelect({ label, name, value, onChange, options }) {
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        {value || '—'}
      </p>
    </div>
  )
}

export default Activities
