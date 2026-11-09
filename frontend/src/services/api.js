
import axios from 'axios'
import API_ENDPOINTS from './endpoints'
import { getAccessToken, setAccessToken } from './tokenStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach the current access token to protected requests.
api.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Prevent multiple simultaneous refresh requests.
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''

    const isAuthRequest = [
      API_ENDPOINTS.AUTH.LOGIN,
      API_ENDPOINTS.AUTH.REFRESH,
      API_ENDPOINTS.AUTH.LOGOUT,
      API_ENDPOINTS.AUTH.CSRF,
    ].some((endpoint) => requestUrl.includes(endpoint))

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = api.post(API_ENDPOINTS.AUTH.REFRESH)
          .then((response) => {
            const newToken = response.data.access

            if (!newToken) {
              throw new Error('Refresh response did not contain an access token.')
            }

            setAccessToken(newToken)

            window.dispatchEvent(
              new CustomEvent('crm:token-refreshed', {
                detail: { accessToken: newToken },
              })
            )

            return newToken
          })
          .catch((refreshError) => {
            setAccessToken(null)
            window.dispatchEvent(
              new Event('crm:session-expired')
            )
            throw refreshError
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newToken = await refreshPromise

      originalRequest.headers.Authorization = `Bearer ${newToken}`

      return api(originalRequest)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  }
)

export default api
