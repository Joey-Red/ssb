import { useSyncExternalStore } from 'react'

export type AppTheme = 'festival' | 'titan'

const THEME_KEY = 'ssbu-training-guide:theme'
const listeners = new Set<() => void>()

function isTheme(value: unknown): value is AppTheme {
  return value === 'festival' || value === 'titan'
}

function readTheme(): AppTheme {
  if (typeof window === 'undefined') return 'festival'
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    return isTheme(stored) ? stored : 'festival'
  } catch {
    return 'festival'
  }
}

let theme: AppTheme = readTheme()

function apply(themeValue: AppTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = themeValue
  document.documentElement.style.colorScheme = themeValue === 'titan' ? 'dark' : 'light dark'
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = themeValue === 'festival' ? '#fff3d6' : '#0b0c0d'
}

apply(theme)

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTheme(): AppTheme {
  return theme
}

export function setTheme(next: AppTheme): void {
  if (next === theme) return
  theme = next
  apply(next)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      // Theme persistence is an enhancement; the current session still updates.
    }
  }
  emit()
}

export function toggleTheme(): void {
  setTheme(theme === 'festival' ? 'titan' : 'festival')
}

export function useTheme(): AppTheme {
  return useSyncExternalStore(subscribe, () => theme, () => 'festival')
}
