
const SETTINGS_KEY = 'crm-user-settings'

export function getDefaultCurrency() {
  try {
    const settings = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || '{}'
    )

    return settings.currency || 'NPR'
  } catch {
    return 'NPR'
  }
}

export function formatCurrency(amount, currency = 'NPR') {
  const value = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'NPR',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency || 'NPR'} ${value.toLocaleString()}`
  }
}

export function groupAmountsByCurrency(
  records,
  getAmount = (record) => record.amount,
  getCurrency = (record) => record.currency
) {
  return records.reduce((groups, record) => {
    const currency = getCurrency(record) || 'NPR'
    const amount = Number(getAmount(record) || 0)

    groups[currency] = (groups[currency] || 0) + amount

    return groups
  }, {})
}

export function formatCurrencyGroups(groups) {
  return Object.entries(groups).map(([currency, amount]) => ({
    currency,
    amount,
    formatted: formatCurrency(amount, currency),
  }))
}
