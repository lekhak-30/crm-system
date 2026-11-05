
export const isRequired = (value) => {
  return String(value ?? '').trim().length > 0
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(String(email ?? '').trim())
}

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[0-9\s()-]{7,20}$/
  return phoneRegex.test(String(phone ?? '').trim())
}

export const validateCustomer = (customer) => {
  const errors = {}

  if (!isRequired(customer.name)) {
    errors.name = 'Customer name is required'
  }

  if (!isRequired(customer.email)) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(customer.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (customer.phone && !isValidPhone(customer.phone)) {
    errors.phone = 'Enter a valid phone number'
  }

  return errors
}
