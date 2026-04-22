import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) {
        return stored === 'dark'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip on first render to prevent hydration/DOM mismatch
    if (isFirstRender.current) {
      isFirstRender.current = false
      // Apply initial theme class without causing re-render
      try {
        const root = document.documentElement
        if (isDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      } catch (err) {
        console.error('[ThemeProvider] Failed to apply initial theme:', err)
      }
      return
    }

    // Subsequent toggles
    try {
      const root = document.documentElement
      if (isDark) {
        root.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        root.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch (err) {
      console.error('[ThemeProvider] Failed to toggle theme:', err)
    }
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
