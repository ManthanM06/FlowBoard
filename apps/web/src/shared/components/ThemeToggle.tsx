import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../stores/themeStore'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas border border-border-subtle transition-all duration-200 focus:outline-none focus:border-accent ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="w-4 h-4 relative flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-text-secondary transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
    </button>
  )
}
