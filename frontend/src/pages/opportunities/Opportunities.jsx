
import { useMemo, useState } from 'react'
import { isRequired } from '../../utils/validators'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  DollarSign,
  CalendarDays,
  Target,
  TrendingUp,
  ChevronDown,
} from 'lucide-react'

const stages = [
  { name: 'Qualification', probability: 10, color: 'bg-blue-500' },
  { name: 'Needs Analysis', probability: 25, color: 'bg-purple-500' },
  { name: 'Proposal', probability: 50, color: 'bg-amber-500' },
  { name: 'Negotiation', probability: 75, color: 'bg-orange-500' },
  { name: 'Closed Won', probability: 100, color: 'bg-green-500' },
  { name: 'Closed Lost', probability: 0, color: 'bg-red-500' },
]

const initialDeals = [
  {
    id: 1,
    title: 'Website Development',
    company: 'Tech Solutions',
    value: 12000,
    stage: 'Qualification',
    assignedTo: 'Admin User',
    closingDate: '2026-12-15',
  },
  {
    id: 2,
    title: 'CRM Software License',
    company: 'Digital Works',
    value: 18000,
    stage: 'Needs Analysis',
    assignedTo: 'Sales Employee',
    closingDate: '2026-12-20',
  },
  {
    id: 3,
    title: 'Mobile Application',
    company: 'Global Systems',
    value: 25000,
    stage: 'Proposal',
    assignedTo: 'Admin User',
    closingDate: '2027-01-10',
  },
  {
    id: 4,
    title: 'Cloud Migration',
    company: 'Creative Studio',
    value: 32000,
    stage: 'Negotiation',
    assignedTo: 'Sales Employee',
    closingDate: '2026-12-28',
  },
  {
    id: 5,
    title: 'Enterprise Software',
    company: 'Wilson Enterprises',
    value: 45000,
    stage: 'Closed Won',
    assignedTo: 'Admin User',
    closingDate: '2026-11-20',
  },
  {
    id: 6,
    title: 'Marketing Platform',
    company: 'Martin Group',
    value: 9000,
    stage: 'Closed Lost',
    assignedTo: 'Sales Employee',
    closingDate: '2026-11-15',
  },
]

const emptyForm = {
  title: '',
  company: '',
  value: '',
  stage: 'Qualification',
  assignedTo: 'Admin User',
  closingDate: '',
}

function Opportunities() {
  const [deals, setDeals] = useState(initialDeals)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const filteredDeals = useMemo(() => {
    const query = search.toLowerCase()

    return deals.filter(
      (deal) =>
        deal.title.toLowerCase().includes(query) ||
        deal.company.toLowerCase().includes(query)
    )
  }, [deals, search])

  const activeDeals = deals.filter(
    (deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)
  )

  const totalPipeline = activeDeals.reduce(
    (sum, deal) => sum + Number(deal.value),
    0
  )

  const wonDeals = deals.filter(
    (deal) => deal.stage === 'Closed Won'
  )

  const wonValue = wonDeals.reduce(
    (sum, deal) => sum + Number(deal.value),
    0
  )

  const weightedPipeline = activeDeals.reduce((sum, deal) => {
    const probability = stages.find(
      (stage) => stage.name === deal.stage
    )?.probability ?? 0

    return sum + Number(deal.value) * probability / 100
  }, 0)

  const openAddModal = () => {
    setEditingDeal(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (deal) => {
    setEditingDeal(deal)
    setForm({
      ...deal,
      value: String(deal.value),
    })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingDeal(null)
    setForm(emptyForm)
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

  // Validate the form before saving.
  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = {}

    if (!isRequired(form.title)) {
      validationErrors.title = 'Deal title is required'
    }

    if (!isRequired(form.company)) {
      validationErrors.company = 'Company name is required'
    }

    const numericValue = Number(form.value)

    if (!isRequired(form.value)) {
      validationErrors.value = 'Deal value is required'
    } else if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      validationErrors.value = 'Enter a valid non-negative amount'
    }

    if (!isRequired(form.assignedTo)) {
      validationErrors.assignedTo =
        'Please assign a sales representative'
    }

    if (!isRequired(form.closingDate)) {
      validationErrors.closingDate =
        'Expected closing date is required'
    } else {
      const closingDate = new Date(`${form.closingDate}T00:00:00`)

      if (Number.isNaN(closingDate.getTime())) {
        validationErrors.closingDate = 'Enter a valid closing date'
      }
    }

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (editingDeal) {
      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === editingDeal.id
            ? { ...deal, ...form, value: numericValue }
            : deal
        )
      )
    } else {
      const newDeal = {
        ...form,
        id: Math.max(0, ...deals.map((deal) => deal.id)) + 1,
        value: numericValue,
      }

      setDeals((previous) => [...previous, newDeal])
    }

    closeModal()
  }

  const moveDeal = (id, stage) => {
    setDeals((previous) =>
      previous.map((deal) =>
        deal.id === id ? { ...deal, stage } : deal
      )
    )
  }

  const deleteDeal = (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return
    }

    setDeals((previous) =>
      previous.filter((deal) => deal.id !== id)
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sales Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track opportunities and manage your sales deals.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Deal
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active Opportunities"
          value={activeDeals.length}
          icon={Target}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Pipeline Value"
          value={`$${totalPipeline.toLocaleString('en-US')}`}
          icon={DollarSign}
          color="bg-purple-50 text-purple-600"
        />

        <SummaryCard
          title="Weighted Pipeline"
          value={`$${Math.round(weightedPipeline).toLocaleString('en-US')}`}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          title="Closed Won"
          value={`$${wonValue.toLocaleString('en-US')}`}
          icon={DollarSign}
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
          placeholder="Search deals or companies..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter(
            (deal) => deal.stage === stage.name
          )

          const stageValue = stageDeals.reduce(
            (sum, deal) => sum + Number(deal.value),
            0
          )

          return (
            <section
              key={stage.name}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-100/70 p-3"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />

                  <h2 className="text-sm font-semibold text-slate-700">
                    {stage.name}
                  </h2>

                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                    {stageDeals.length}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  ${stageValue.toLocaleString('en-US')}
                </p>
              </div>

              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={() => openEditModal(deal)}
                    onDelete={() => deleteDeal(deal.id)}
                    onMove={(nextStage) =>
                      moveDeal(deal.id, nextStage)
                    }
                  />
                ))}

                {stageDeals.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-6 text-center text-xs text-slate-400">
                    No deals in this stage
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <p className="text-xs text-slate-400">
        Sample opportunities stored in local React state. Changes are not
        persisted to the database.
      </p>

      {/* Add / Edit deal modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
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
              <DealField
                label="Deal Title"
                name="title"
                value={form.title}
                onChange={updateForm}
                error={errors.title}
                required
              />

              <DealField
                label="Company"
                name="company"
                value={form.company}
                onChange={updateForm}
                error={errors.company}
                required
              />

              <DealField
                label="Deal Value ($)"
                name="value"
                type="number"
                value={form.value}
                onChange={updateForm}
                error={errors.value}
                required
              />

              <DealSelect
                label="Sales Stage"
                name="stage"
                value={form.stage}
                onChange={updateForm}
                options={stages.map((stage) => stage.name)}
              />

              <DealSelect
                label="Assigned To"
                name="assignedTo"
                value={form.assignedTo}
                onChange={updateForm}
                error={errors.assignedTo}
                options={['Admin User', 'Sales Employee']}
              />

              <DealField
                label="Expected Closing Date"
                name="closingDate"
                type="date"
                value={form.closingDate}
                onChange={updateForm}
                error={errors.closingDate}
                required
              />

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
                  {editingDeal ? 'Save Changes' : 'Create Deal'}
                </button>
              </div>
            </form>
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

      <p className="mt-3 text-2xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function DealCard({ deal, onEdit, onDelete, onMove }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          {deal.title}
        </h3>

        <div className="group relative shrink-0">
          <button
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Deal actions"
          >
            <MoreHorizontal size={18} />
          </button>

          <div className="absolute right-0 top-7 z-10 hidden w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg group-focus-within:block group-hover:block">
            <button
              onClick={onEdit}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={14} /> Edit
            </button>

            <button
              onClick={onDelete}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {deal.company}
      </p>

      <p className="mt-4 text-lg font-bold text-slate-800">
        ${Number(deal.value).toLocaleString('en-US')}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays size={14} />
        {deal.closingDate || 'No closing date'}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Assigned: {deal.assignedTo}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Move to stage
        </label>

        <div className="relative">
          <select
            value={deal.stage}
            onChange={(event) => onMove(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-600 outline-none focus:border-blue-500"
            aria-label={`Change stage for ${deal.title}`}
          >
            {stages.map((stage) => (
              <option key={stage.name} value={stage.name}>
                {stage.name}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>
    </article>
  )
}

function DealField({
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

function DealSelect({ label, name, value, onChange, options, error }) {
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
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-slate-200 focus:border-blue-500'
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default Opportunities
