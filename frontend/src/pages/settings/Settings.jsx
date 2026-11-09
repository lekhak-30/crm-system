
import {
  User,
  Palette,
  SlidersHorizontal,
  Shield,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

function Settings() {
  const { user } = useAuth()
  const { settings, updateSetting } = useSettings()

  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'User'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account and CRM preferences.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
            <User size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              My Profile
            </h2>
            <p className="text-sm text-slate-500">
              Your current account information.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Name
            </label>
            <input
              value={displayName}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Username
            </label>
            <input
              value={user?.username || ''}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              value={user?.email || ''}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Role
            </label>
            <input
              value={user?.role || ''}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Profile editing will be enabled after backend integration.
        </p>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2.5 text-purple-700">
            <Palette size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              Appearance
            </h2>
            <p className="text-sm text-slate-500">
              Choose how your CRM looks.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ].map((option) => {
            const Icon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting('theme', option.value)}
                className={`flex items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition ${
                  settings.theme === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={19} />
                {option.label}
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Theme changes are applied across the CRM and saved automatically.
        </p>
      </section>

      {/* CRM Preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
            <SlidersHorizontal size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              CRM Preferences
            </h2>
            <p className="text-sm text-slate-500">
              Set your preferred display formats.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Default Currency
            </label>
            <select
              value={settings.currency}
              onChange={(event) =>
                updateSetting('currency', event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="NPR">NPR - Nepalese Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(event) =>
                updateSetting('dateFormat', event.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Preferences are saved automatically.
        </p>
      </section>

      {/* Security */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2.5 text-green-700">
            <Shield size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              Security
            </h2>
            <p className="text-sm text-slate-500">
              Account security and password management.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            Password Management
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Password changes are not connected yet. We need to implement
            and verify the backend password-change endpoint first.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Settings
