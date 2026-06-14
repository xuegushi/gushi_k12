import { create } from 'zustand'

export type ColorScheme = 'default' | 'ink' | 'nature' | 'vermillion' | 'playful'

interface UIConfig {
  theme: 'light' | 'dark'
  colorScheme: ColorScheme
  setTheme: (t: 'light' | 'dark') => void
  setColorScheme: (s: ColorScheme) => void
  initTheme: () => void
}

const SCHEMES: ColorScheme[] = ['default', 'ink', 'nature', 'vermillion', 'playful']

export function applyColorScheme(scheme: ColorScheme) {
  document.documentElement.setAttribute('data-color-scheme', scheme)
  localStorage.setItem('colorScheme', scheme)
}

export const useUIConfig = create<UIConfig>(set => ({
  theme: 'light',
  colorScheme: 'default',
  setTheme: (t) => {
    set({ theme: t })
    localStorage.setItem('theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  },
  setColorScheme: (s) => {
    set({ colorScheme: s })
    applyColorScheme(s)
  },
  initTheme: () => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const t = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (prefersDark ? 'dark' : 'light')
    set({ theme: t })
    document.documentElement.classList.toggle('dark', t === 'dark')

    const savedScheme = localStorage.getItem('colorScheme') as ColorScheme | null
    const s = savedScheme && SCHEMES.includes(savedScheme) ? savedScheme : 'default'
    set({ colorScheme: s })
    applyColorScheme(s)
  },
}))
