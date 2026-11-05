
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
    CURRENT_USER: '/auth/me/',
    FORGOT_PASSWORD: '/auth/password-reset/',
  },

  DASHBOARD: {
    SUMMARY: '/dashboard/summary/',
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
  },

  ACTIVITIES: {
    LIST: '/activities/',
    DETAIL: (id) => `/activities/${id}/`,
  },

  REPORTS: {
    SUMMARY: '/reports/summary/',
  },

  USERS: {
    LIST: '/users/',
    DETAIL: (id) => `/users/${id}/`,
  },
}

export default API_ENDPOINTS
