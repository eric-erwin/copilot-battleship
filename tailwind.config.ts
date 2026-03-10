import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // indigo-500
          dark: '#4f46e5',
        },
        surface: {
          DEFAULT: '#f8fafc', // slate-50
          dark: '#1e293b',    // slate-800
        },
      },
    },
  },
  plugins: [],
}

export default config

