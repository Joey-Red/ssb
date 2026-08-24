import type { FighterFrameData, FrameMove, MoveCategory } from '../types'

export type DiscoveryPool = 'attacks' | 'all'

const ATTACK_CATEGORIES = new Set<MoveCategory>(['ground', 'aerial', 'special'])

export function isDefaultDiscoveryMove(move: FrameMove): boolean {
  return ATTACK_CATEGORIES.has(move.category)
}

export function discoverFastMoves(
  fighters: readonly FighterFrameData[],
  options: { maxStartup: number; query?: string; pool?: DiscoveryPool; limit?: number },
) {
  const normalized = options.query?.trim().toLowerCase() ?? ''
  const pool = options.pool ?? 'attacks'
  const limit = options.limit ?? 80

  return fighters.flatMap((fighter) => fighter.moves.flatMap((move) => {
    if (move.startupFrame === null || move.startupFrame > options.maxStartup) return []
    if (pool === 'attacks' && !isDefaultDiscoveryMove(move)) return []
    if (normalized && !`${fighter.name} ${move.name} ${move.category}`.toLowerCase().includes(normalized)) return []
    return [{ fighter, move }]
  }))
    .sort((a, b) => (a.move.startupFrame ?? 999) - (b.move.startupFrame ?? 999) || a.fighter.name.localeCompare(b.fighter.name) || a.move.name.localeCompare(b.move.name))
    .slice(0, limit)
}
