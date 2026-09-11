import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'flowboard_theme'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  initTheme: () => void
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore localStorage errors
    }
    applyThemeToDOM(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const current = get().theme
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  initTheme: () => {
    const initial = getInitialTheme()
    applyThemeToDOM(initial)
    set({ theme: initial })

    // Listen for OS color scheme changes if user hasn't explicitly saved a preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        if (!saved) {
          const newTheme: Theme = e.matches ? 'dark' : 'light'
          get().setTheme(newTheme)
        }
      }
      mediaQuery.addEventListener('change', handleChange)
    }
  },
}))
