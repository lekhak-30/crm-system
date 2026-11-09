
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  LockKeyhole,
  User,
  Eye,
  EyeOff,
  BriefcaseBusiness,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { user, loading, login } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Checking your session...
        </p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }

    setSubmitting(true)

    try {
      const result = await login(username, password)

      if (!result.success) {
        setError(result.message)
        return
      }

      navigate('/dashboard', { replace: true })
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* Left panel */}
        <div className="hidden flex-col justify-between bg-blue-700 p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3">
                <BriefcaseBusiness size={28} />
              </div>

              <span className="text-2xl font-bold">
                CRM System
              </span>
            </div>

            <div className="mt-24">
              <h1 className="text-4xl font-bold leading-tight">
                Manage your customer relationships with confidence.
              </h1>

              <p className="mt-5 leading-7 text-blue-100">
                Organize customers, track leads, manage sales opportunities,
                and understand your business performance in one place.
              </p>
            </div>
          </div>

          <p className="text-sm text-blue-200">
            Customer Relationship Management System
          </p>
        </div>

        {/* Login form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 md:hidden">
                <BriefcaseBusiness size={28} />
              </div>

              <h2 className="text-3xl font-bold text-slate-800">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to access your CRM dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={submitting}
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              CRM System · Frontend Development Version
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
