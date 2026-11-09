
const API_ENDPOINTS = {
  AUTH: {
    CSRF: '/auth/csrf/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
    CURRENT_USER: '/auth/me/',
  },

  DASHBOARD: {
    SUMMARY: '/dashboard/',
  },

  CUSTOMERS: {
    LIST: '/customers/',
    DETAIL: (id) => `/customers/${id}/`,
  },

  LEADS: {
    LIST: '/leads/',
    DETAIL: (id) => `/leads/${id}/`,
    CONVERT: (id) => `/leads/${id}/convert/`,
  },

  OPPORTUNITIES: {
    LIST: '/opportunities/',
    DETAIL: (id) => `/opportunities/${id}/`,
    CLOSE_WON: (id) => `/opportunities/${id}/close-won/`,
    CLOSE_LOST: (id) => `/opportunities/${id}/close-lost/`,
  },

  ACTIVITIES: {
    LIST: '/activities/',
    DETAIL: (id) => `/activities/${id}/`,
    COMPLETE: (id) => `/activities/${id}/complete/`,
  },

REPORTS: {
  SUMMARY: '/reports/dashboard/',
  SALES_PIPELINE: '/reports/sales-pipeline/',
  REVENUE: '/reports/revenue/',
  LEAD_CONVERSION: '/reports/lead-conversion/',
  SALES_PERFORMANCE: '/reports/sales-performance/',
},

  USERS: {
    LIST: '/auth/users/',
    DETAIL: (id) => `/auth/users/${id}/`,
  },
}

export default API_ENDPOINTS
