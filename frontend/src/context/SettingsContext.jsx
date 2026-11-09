
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const STORAGE_KEY = 'crm-user-settings'

const DEFAULT_SETTINGS = {
  theme: 'light',
  currency: 'NPR',
  dateFormat: 'DD/MM/YYYY',
}

const SettingsContext = createContext(null)

function getSavedSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}'
    )

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(getSavedSettings)

  // Save preferences whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      )
    } catch (error) {
      console.error('Unable to save settings:', error)
    }
  }, [settings])

  // Apply the selected theme throughout the application.
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    )

    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches)

      document.documentElement.classList.toggle('dark', isDark)
    }

    applyTheme()

    mediaQuery.addEventListener('change', applyTheme)

    return () => {
      mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [settings.theme])

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error(
      'useSettings must be used inside SettingsProvider'
    )
  }

  return context
}
