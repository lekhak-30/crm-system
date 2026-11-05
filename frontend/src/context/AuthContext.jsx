
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('crm_user')

    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      sessionStorage.removeItem('crm_user')
      return null
    }
  })

  // DEMO ONLY: Replace with Django authentication later.
  const login = (email, password, role) => {
    if (!email.trim() || !password.trim()) {
      return {
        success: false,
        message: 'Email and password are required.',
      }
    }

    const validRoles = [
      'Administrator',
      'Sales Manager',
      'Sales Employee',
    ]

    if (!validRoles.includes(role)) {
      return {
        success: false,
        message: 'Please select a valid demo role.',
      }
    }

    const demoUser = {
      id: 1,
      name: role === 'Administrator'
        ? 'Admin User'
        : role === 'Sales Manager'
          ? 'Sales Manager'
          : 'Sales Employee',
      email,
      role,
    }

    setUser(demoUser)
    sessionStorage.setItem('crm_user', JSON.stringify(demoUser))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('crm_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
