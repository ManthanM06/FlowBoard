/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        sunken: 'var(--bg-sunken)',
        'border-subtle': 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-disabled': 'var(--text-disabled)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        priority: {
          low: 'var(--priority-low)',
          medium: 'var(--priority-medium)',
          high: 'var(--priority-high)',
        },
        status: {
          success: 'var(--status-success)',
          error: 'var(--status-error)',
        }
      },
      fontFamily: {
        sans: ['"Public Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        button: '6px',
        chip: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 26, 22, 0.05)',
        drag: '0 8px 24px rgba(28, 26, 22, 0.12), 0 2px 6px rgba(28, 26, 22, 0.08)',
        modal: '0 12px 32px rgba(28, 26, 22, 0.15)',
      }
    },
  },
  plugins: [],
}
