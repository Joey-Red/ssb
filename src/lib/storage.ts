import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ssbu-training-guide:v1'
const RECENT_LIMIT = 8

export interface PracticeProgress {
  stepIndex: number
  repetitions: Readonly<Record<string, number>>
  completed: readonly number[]
}

interface LocalState {
  favorites: readonly string[]
  recents: readonly string[]
  practice: Readonly<Record<string, PracticeProgress>>
}

const emptyState: LocalState = { favorites: [], recents: [], practice: {} }
const listeners = new Set<() => void>()

function sanitizeProgress(value: unknown): PracticeProgress | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<PracticeProgress>
  const stepIndex = Number.isInteger(record.stepIndex) && (record.stepIndex ?? -1) >= 0 ? record.stepIndex as number : 0
  const repetitions: Record<string, number> = {}
  if (record.repetitions && typeof record.repetitions === 'object') {
    for (const [key, raw] of Object.entries(record.repetitions)) {
      if (Number.isInteger(raw) && raw >= 0) repetitions[key] = raw
    }
  }
  const completed = Array.isArray(record.completed)
    ? record.completed.filter((item): item is number => Number.isInteger(item) && item >= 0)
    : []
  return { stepIndex, repetitions, completed }
}

function loadState(): LocalState {
  if (typeof window === 'undefined') return emptyState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<LocalState>
    const practice: Record<string, PracticeProgress> = {}
    if (parsed.practice && typeof parsed.practice === 'object') {
      for (const [fighterId, value] of Object.entries(parsed.practice)) {
        const progress = sanitizeProgress(value)
        if (progress) practice[fighterId] = progress
      }
    }
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((item): item is string => typeof item === 'string') : [],
      recents: Array.isArray(parsed.recents) ? parsed.recents.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LIMIT) : [],
      practice,
    }
  } catch {
    return emptyState
  }
}

let state: LocalState = loadState()

function emit(): void {
  for (const listener of listeners) listener()
}

function persist(next: LocalState): void {
  state = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage is an enhancement. The in-memory state still works for this session.
    }
  }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = loadState()
    emit()
  })
}

export function useLocalState(): LocalState {
  return useSyncExternalStore(subscribe, () => state, () => emptyState)
}

export function toggleFavorite(fighterId: string): void {
  const favorites = state.favorites.includes(fighterId)
    ? state.favorites.filter((id) => id !== fighterId)
    : [...state.favorites, fighterId]
  persist({ ...state, favorites })
}

export function recordRecent(fighterId: string): void {
  const recents = [fighterId, ...state.recents.filter((id) => id !== fighterId)].slice(0, RECENT_LIMIT)
  if (recents.join('|') === state.recents.join('|')) return
  persist({ ...state, recents })
}

export function clearLocalData(): void {
  state = emptyState
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore unavailable browser storage.
    }
  }
  emit()
}

export function setPracticeStep(fighterId: string, stepIndex: number): void {
  const current = state.practice[fighterId] ?? { stepIndex: 0, repetitions: {}, completed: [] }
  const practice = { ...state.practice, [fighterId]: { ...current, stepIndex } }
  persist({ ...state, practice })
}

export function incrementPracticeRep(fighterId: string, percent: number): void {
  const current = state.practice[fighterId] ?? { stepIndex: 0, repetitions: {}, completed: [] }
  const key = String(percent)
  const repetitions = { ...current.repetitions, [key]: (current.repetitions[key] ?? 0) + 1 }
  const practice = { ...state.practice, [fighterId]: { ...current, repetitions } }
  persist({ ...state, practice })
}

export function togglePracticeComplete(fighterId: string, percent: number): void {
  const current = state.practice[fighterId] ?? { stepIndex: 0, repetitions: {}, completed: [] }
  const completed = current.completed.includes(percent)
    ? current.completed.filter((item) => item !== percent)
    : [...current.completed, percent].sort((a, b) => a - b)
  const practice = { ...state.practice, [fighterId]: { ...current, completed } }
  persist({ ...state, practice })
}

export function resetPractice(fighterId: string): void {
  const practice = { ...state.practice }
  delete practice[fighterId]
  persist({ ...state, practice })
}
