
import { useMemo, useState } from 'react'
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
} from 'lucide-react'

const initialActivities = [
  {
    id: 1,
    title: 'Follow up with John Smith',
    description: 'Discuss website development requirements.',
    type: 'Call',
    relatedTo: 'Tech Solutions',
    assignedTo: 'Admin User',
    priority: 'High',
    dueDate: '2026-11-07',
    status: 'Pending',
  },
  {
    id: 2,
    title: 'Product demonstration',
    description: 'Demonstrate the CRM platform to the client.',
    type: 'Meeting',
    relatedTo: 'Digital Works',
    assignedTo: 'Sales Employee',
    priority: 'High',
    dueDate: '2026-11-08',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'Send pricing proposal',
    description: 'Email the updated pricing proposal.',
    type: 'Email',
    relatedTo: 'Global Systems',
    assignedTo: 'Admin User',
    priority: 'Medium',
    dueDate: '2026-11-09',
    status: 'Pending',
  },
  {
    id: 4,
    title: 'Update customer information',
    description: 'Verify customer contact details.',
    type: 'Task',
    relatedTo: 'Creative Studio',
    assignedTo: 'Sales Employee',
    priority: 'Low',
    dueDate: '2026-11-05',
    status: 'Completed',
  },
  {
    id: 5,
    title: 'Discuss contract terms',
    description: 'Review the final contract conditions.',
    type: 'Call',
    relatedTo: 'Wilson Enterprises',
    assignedTo: 'Admin User',
    priority: 'High',
    dueDate: '2026-11-04',
    status: 'Pending',
  },
  {
    id: 6,
    title: 'Prepare sales report',
    description: 'Prepare the weekly sales performance report.',
    type: 'Task',
    relatedTo: 'Internal',
    assignedTo: 'Sales Employee',
    priority: 'Medium',
    dueDate: '2026-11-12',
    status: 'Completed',
  },
]

const emptyForm = {
  title: '',
  description: '',
  type: 'Call',
  relatedTo: '',
  assignedTo: 'Admin User',
  priority: 'Medium',
  dueDate: '',
  status: 'Pending',
}

function Activities() {
  const [activities, setActivities] = useState(initialActivities)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const today = new Date().toISOString().slice(0, 10)

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase()

    return activities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(query) ||
        activity.relatedTo.toLowerCase().includes(query) ||
        activity.assignedTo.toLowerCase().includes(query)

      const matchesType =
        typeFilter === 'All' || activity.type === typeFilter

      const matchesStatus =
        statusFilter === 'All' || activity.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [activities, search, typeFilter, statusFilter])

  const pendingCount = activities.filter(
    (activity) => activity.status === 'Pending'
  ).length

  const completedCount = activities.filter(
    (activity) => activity.status === 'Completed'
  ).length

  const overdueCount = activities.filter(
    (activity) =>
      activity.status === 'Pending' &&
      activity.dueDate < today
  ).length

  const openAddModal = () => {
    setEditingActivity(null)
    setForm({ ...emptyForm })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (activity) => {
    setEditingActivity(activity)
    setForm({ ...activity })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingActivity(null)
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

    if (!form.title.trim()) {
      newErrors.title = 'Activity title is required.'
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Title must contain at least 3 characters.'
    }

    if (!form.relatedTo.trim()) {
      newErrors.relatedTo = 'Related customer or lead is required.'
    }

    if (!form.dueDate) {
      newErrors.dueDate = 'Due date is required.'
    } else {
      const selectedDate = new Date(`${form.dueDate}T00:00:00`)

      if (Number.isNaN(selectedDate.getTime())) {
        newErrors.dueDate = 'Please enter a valid due date.'
      } else if (
        form.status === 'Pending' &&
        form.dueDate < today &&
        form.dueDate !== editingActivity?.dueDate
      ) {
        newErrors.dueDate =
          'A new pending activity cannot have a past due date.'
      }
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

    const cleanedForm = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      relatedTo: form.relatedTo.trim(),
    }

    if (editingActivity) {
      setActivities((previous) =>
        previous.map((activity) =>
          activity.id === editingActivity.id
            ? { ...activity, ...cleanedForm }
            : activity
        )
      )
    } else {
      const newActivity = {
        ...cleanedForm,
        id: Math.max(0, ...activities.map((activity) => activity.id)) + 1,
      }

      setActivities((previous) => [newActivity, ...previous])
    }

    closeModal()
  }

  const toggleCompletion = (id) => {
    setActivities((previous) =>
      previous.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              status:
                activity.status === 'Completed'
                  ? 'Pending'
                  : 'Completed',
            }
          : activity
      )
    )
  }

  const deleteActivity = (id) => {
    if (!window.confirm('Delete this activity?')) return

    setActivities((previous) =>
      previous.filter((activity) => activity.id !== id)
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Activities & Follow-ups
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize calls, meetings, emails and sales tasks.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Activity
        </button>
      </div>

      {/* Summary cards */}
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

      {/* Filters */}
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
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          aria-label="Filter by activity type"
        >
          <option value="All">All types</option>
          <option value="Call">Calls</option>
          <option value="Meeting">Meetings</option>
          <option value="Email">Emails</option>
          <option value="Task">Tasks</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          aria-label="Filter by activity status"
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Activity list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800">
            Activity Schedule
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredActivities.length} activities found
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredActivities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onView={() => setSelectedActivity(activity)}
              onEdit={() => openEditModal(activity)}
              onDelete={() => deleteActivity(activity.id)}
              onToggle={() => toggleCompletion(activity.id)}
            />
          ))}

          {filteredActivities.length === 0 && (
            <div className="px-5 py-12 text-center">
              <ListTodo
                size={32}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="text-sm font-medium text-slate-600">
                No activities found
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Sample activities are stored in local React state. They are not
        connected to the Django database.
      </p>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
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

            <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
              <ActivityField
                label="Activity Title"
                name="title"
                value={form.title}
                onChange={updateForm}
                required
                error={errors.title}
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
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ActivitySelect
                  label="Activity Type"
                  name="type"
                  value={form.type}
                  onChange={updateForm}
                  options={['Call', 'Meeting', 'Email', 'Task']}
                />

                <ActivitySelect
                  label="Priority"
                  name="priority"
                  value={form.priority}
                  onChange={updateForm}
                  options={['Low', 'Medium', 'High']}
                />

                <ActivityField
                  label="Related Customer / Lead"
                  name="relatedTo"
                  value={form.relatedTo}
                  onChange={updateForm}
                  required
                  error={errors.relatedTo}
                />

                <ActivitySelect
                  label="Assigned To"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={updateForm}
                  options={['Admin User', 'Sales Employee']}
                />

                <ActivityField
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={updateForm}
                  required
                  error={errors.dueDate}
                />

                <ActivitySelect
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  options={['Pending', 'Completed']}
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
                  {editingActivity ? 'Save Changes' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity details modal */}
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
              {Object.entries({
                Title: selectedActivity.title,
                Description: selectedActivity.description || 'No description',
                Type: selectedActivity.type,
                RelatedTo: selectedActivity.relatedTo,
                AssignedTo: selectedActivity.assignedTo,
                Priority: selectedActivity.priority,
                DueDate: selectedActivity.dueDate,
                Status: selectedActivity.status,
              }).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {label.replace(/([A-Z])/g, ' $1')}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {value}
                  </p>
                </div>
              ))}
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
  onView,
  onEdit,
  onDelete,
  onToggle,
}) {
  const typeIcons = {
    Call: Phone,
    Meeting: CalendarDays,
    Email: Mail,
    Task: CheckSquare,
  }

  const Icon = typeIcons[activity.type]

  const priorityStyles = {
    High: 'bg-red-50 text-red-700',
    Medium: 'bg-amber-50 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
  }

  const isOverdue =
    activity.status === 'Pending' &&
    activity.dueDate < new Date().toISOString().slice(0, 10)

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
            {activity.title}
          </button>

          <p className="mt-1 text-xs text-slate-500">
            {activity.description}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {activity.type} · {activity.relatedTo} · {activity.assignedTo}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[activity.priority]}`}>
          {activity.priority}
        </span>

        <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
          {activity.dueDate}
          {isOverdue && ' · Overdue'}
        </span>

        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          activity.status === 'Completed'
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {activity.status}
        </span>

        <div className="flex gap-1">
          <RowAction label="Toggle completion" onClick={onToggle}>
            <CheckCircle size={17} />
          </RowAction>

          <RowAction label="Edit activity" onClick={onEdit}>
            <Pencil size={17} />
          </RowAction>

          <RowAction label="Delete activity" onClick={onDelete} danger>
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
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
          error ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
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
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Activities
