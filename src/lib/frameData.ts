import type { FrameMove } from '../types'

export function frameNumbers(value: string | null): number[] {
  if (!value) return []
  return [...value.matchAll(/\d+/g)].map((match) => Number(match[0])).filter(Number.isFinite)
}

export function firstFrame(value: string | null): number | null {
  return frameNumbers(value)[0] ?? null
}

export function lastFrame(value: string | null): number | null {
  const values = frameNumbers(value)
  return values[values.length - 1] ?? null
}

export function numericValue(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

export type OosTiming = {
  startup: number
  method: 'direct' | 'jumpsquat'
  note: string
}

export function oosTiming(move: FrameMove): OosTiming | null {
  if (!move.startupFrame) return null
  const name = move.name.toLowerCase()
  if (name.startsWith('up b') || name.startsWith('up smash')) {
    return {
      startup: move.startupFrame,
      method: 'direct',
      note: 'Up special and up smash can be performed directly out of shield.',
    }
  }
  if (move.category === 'aerial') {
    return {
      startup: move.startupFrame + 3,
      method: 'jumpsquat',
      note: 'Aerial OOS startup adds Ultimate’s universal 3-frame jumpsquat.',
    }
  }
  return null
}

export function fastestOosOptions(moves: readonly FrameMove[], limit = 5) {
  return moves
    .flatMap((move) => {
      const timing = oosTiming(move)
      return timing ? [{ move, timing }] : []
    })
    .sort((a, b) => a.timing.startup - b.timing.startup || a.move.name.localeCompare(b.move.name))
    .slice(0, limit)
}

export function isComplexActiveNotation(active: string | null): boolean {
  if (!active) return false
  return /[/()]|\*|\.\.\./.test(active)
}
