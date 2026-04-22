import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  const handleToggle = () => {
    console.log('[ThemeToggle] Before toggle, isDark:', isDark, 'dark class:', document.documentElement.classList.contains('dark'))
    toggleTheme()
    console.log('[ThemeToggle] After toggle, dark class:', document.documentElement.classList.contains('dark'))
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  )
}
