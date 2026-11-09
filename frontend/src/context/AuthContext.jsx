
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import api from '../services/api'
import API_ENDPOINTS from '../services/endpoints'
import { setAccessToken } from '../services/tokenStore'

const AuthContext = createContext(null)

function normalizeUser(data) {
  return {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim()
      || data.username,
    role: data.role_display,
    roleCode: data.role,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [loading, setLoading] = useState(true)

  function updateToken(token) {
    setAccessToken(token)
    setAccessTokenState(token)
  }

  // Restore session and listen for token events.
  useEffect(() => {
    let active = true

    const handleTokenRefresh = (event) => {
      if (active) {
        updateToken(event.detail.accessToken)
      }
    }

    const handleSessionExpired = () => {
      updateToken(null)
      setUser(null)
    }

    window.addEventListener(
      'crm:token-refreshed',
      handleTokenRefresh
    )

    window.addEventListener(
      'crm:session-expired',
      handleSessionExpired
    )

    async function restoreSession() {
      try {
        await api.get(API_ENDPOINTS.AUTH.CSRF)

        const response = await api.post(
          API_ENDPOINTS.AUTH.REFRESH
        )

        const token = response.data.access

        if (!token) {
          throw new Error('Access token was not returned.')
        }

        updateToken(token)

        const userResponse = await api.get(
          API_ENDPOINTS.AUTH.CURRENT_USER
        )

        if (active) {
          setUser(normalizeUser(userResponse.data))
        }
      } catch {
        if (active) {
          updateToken(null)
          setUser(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false

      window.removeEventListener(
        'crm:token-refreshed',
        handleTokenRefresh
      )

      window.removeEventListener(
        'crm:session-expired',
        handleSessionExpired
      )
    }
  }, [])

  // Real Django login.
  const login = async (username, password) => {
    try {
      await api.get(API_ENDPOINTS.AUTH.CSRF)

      const response = await api.post(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          username: username.trim(),
          password,
        }
      )

      const token = response.data.access
      const authenticatedUser = response.data.user

      if (!token || !authenticatedUser) {
        throw new Error('Invalid authentication response.')
      }

      updateToken(token)
      setUser(normalizeUser(authenticatedUser))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.detail
          || error.response?.data?.non_field_errors?.[0]
          || error.message
          || 'Unable to sign in.',
      }
    }
  }

  // Django logout.
  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      updateToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
