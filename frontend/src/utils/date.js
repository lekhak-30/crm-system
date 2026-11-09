
function parseDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const text = String(value)

  // Prevent timezone shifts for date-only values.
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)

  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(text)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, format = 'DD/MM/YYYY') {
  const date = parseDate(value)
  if (!date) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`

    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`

    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

export function formatDateTime(value, format = 'DD/MM/YYYY') {
  const date = parseDate(value)
  if (!date) return 'Date unavailable'

  return `${formatDate(date, format)} ${date.toLocaleTimeString()}`
}
