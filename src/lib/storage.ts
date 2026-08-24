import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ssbu-training-guide:v1'
const RECENT_LIMIT = 8
const DRILL_LIMIT = 100

export interface PracticeProgress {
  stepIndex: number
  repetitions: Readonly<Record<string, number>>
  completed: readonly number[]
}

export interface CustomDrill {
  id: string
  fighterId: string
  title: string
  route: readonly string[]
  percent: number | null
  targetReps: number
  completedReps: number
  notes: string
  createdAt: string
}

interface LocalState {
  favorites: readonly string[]
  recents: readonly string[]
  practice: Readonly<Record<string, PracticeProgress>>
  drills: readonly CustomDrill[]
}

const emptyState: LocalState = { favorites: [], recents: [], practice: {}, drills: [] }
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

function sanitizeDrill(value: unknown): CustomDrill | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<CustomDrill>
  if (typeof record.id !== 'string' || !record.id) return null
  if (typeof record.fighterId !== 'string' || !record.fighterId) return null
  if (typeof record.title !== 'string' || !record.title.trim()) return null
  const route = Array.isArray(record.route)
    ? record.route.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : []
  if (route.length === 0) return null
  const percent = record.percent === null
    ? null
    : Number.isInteger(record.percent) && (record.percent ?? -1) >= 0 && (record.percent ?? 1000) <= 999
      ? record.percent as number
      : null
  const targetReps = Number.isInteger(record.targetReps) && (record.targetReps ?? 0) > 0
    ? Math.min(999, record.targetReps as number)
    : 10
  const completedReps = Number.isInteger(record.completedReps) && (record.completedReps ?? -1) >= 0
    ? Math.min(targetReps, record.completedReps as number)
    : 0
  return {
    id: record.id,
    fighterId: record.fighterId,
    title: record.title.trim().slice(0, 100),
    route: route.slice(0, 12),
    percent,
    targetReps,
    completedReps,
    notes: typeof record.notes === 'string' ? record.notes.trim().slice(0, 500) : '',
    createdAt: typeof record.createdAt === 'string' && record.createdAt ? record.createdAt : new Date(0).toISOString(),
  }
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
    const drills = Array.isArray(parsed.drills)
      ? parsed.drills.map(sanitizeDrill).filter((drill): drill is CustomDrill => drill !== null).slice(0, DRILL_LIMIT)
      : []
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((item): item is string => typeof item === 'string') : [],
      recents: Array.isArray(parsed.recents) ? parsed.recents.filter((item): item is string => typeof item === 'string').slice(0, RECENT_LIMIT) : [],
      practice,
      drills,
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

export interface NewDrillInput {
  fighterId: string
  title: string
  route: readonly string[]
  percent: number | null
  targetReps: number
  notes?: string
}

export function addCustomDrill(input: NewDrillInput): void {
  const title = input.title.trim()
  const route = input.route.map((item) => item.trim()).filter(Boolean).slice(0, 12)
  if (!input.fighterId || !title || route.length === 0) return
  const targetReps = Math.max(1, Math.min(999, Math.trunc(input.targetReps) || 10))
  const percent = input.percent === null ? null : Math.max(0, Math.min(999, Math.trunc(input.percent)))
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `drill-${crypto.randomUUID()}`
    : `drill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const drill: CustomDrill = {
    id,
    fighterId: input.fighterId,
    title: title.slice(0, 100),
    route,
    percent,
    targetReps,
    completedReps: 0,
    notes: (input.notes ?? '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  }
  persist({ ...state, drills: [drill, ...state.drills].slice(0, DRILL_LIMIT) })
}

export function incrementCustomDrill(drillId: string): void {
  const drills = state.drills.map((drill) => drill.id === drillId
    ? { ...drill, completedReps: Math.min(drill.targetReps, drill.completedReps + 1) }
    : drill)
  persist({ ...state, drills })
}

export function resetCustomDrill(drillId: string): void {
  const drills = state.drills.map((drill) => drill.id === drillId ? { ...drill, completedReps: 0 } : drill)
  persist({ ...state, drills })
}

export function removeCustomDrill(drillId: string): void {
  persist({ ...state, drills: state.drills.filter((drill) => drill.id !== drillId) })
}

export function clearCompletedDrills(): void {
  persist({ ...state, drills: state.drills.filter((drill) => drill.completedReps < drill.targetReps) })
}
