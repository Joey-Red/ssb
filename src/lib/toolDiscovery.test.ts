import { describe, expect, it } from 'vitest'
import type { FighterFrameData, FrameMove, MoveCategory } from '../types'
import { discoverFastMoves, isDefaultDiscoveryMove } from './toolDiscovery'

function move(id: string, category: MoveCategory, startupFrame: number): FrameMove {
  return {
    id,
    name: id.replaceAll('-', ' '),
    category,
    startup: String(startupFrame),
    startupFrame,
    active: null,
    totalFrames: null,
    faf: null,
    landingLag: null,
    autocancel: null,
    damage: null,
    onShield: null,
    shieldLag: null,
    shieldStun: null,
    hitboxType: null,
    endLag: null,
    notes: null,
  }
}

const fighter: FighterFrameData = {
  fighterId: 'test',
  name: 'Test Fighter',
  sourceUrl: 'https://example.com',
  stats: { weight: null, gravity: null, walkSpeed: null, runSpeed: null, initialDash: null, airSpeed: null, airAcceleration: null, fallSpeed: null, fastFallSpeed: null },
  moves: [move('jab', 'ground', 2), move('neutral-air', 'aerial', 4), move('neutral-b', 'special', 5), move('pummel', 'grab', 1), move('spot-dodge', 'defense', 3), move('misc-effect', 'misc', 1)],
}

describe('fast-move discovery', () => {
  it('treats attacks as ground, aerial, or special moves', () => {
    expect(isDefaultDiscoveryMove(move('jab', 'ground', 2))).toBe(true)
    expect(isDefaultDiscoveryMove(move('pummel', 'grab', 1))).toBe(false)
    expect(isDefaultDiscoveryMove(move('spot-dodge', 'defense', 3))).toBe(false)
    expect(isDefaultDiscoveryMove(move('misc', 'misc', 1))).toBe(false)
  })

  it('excludes pummels and utility rows from the default fast-button results', () => {
    expect(discoverFastMoves([fighter], { maxStartup: 6 }).map(({ move: result }) => result.id)).toEqual(['jab', 'neutral-air', 'neutral-b'])
  })

  it('can include all sourced move rows when explicitly requested', () => {
    const ids = discoverFastMoves([fighter], { maxStartup: 6, pool: 'all' }).map(({ move: result }) => result.id)
    expect(ids).toContain('pummel')
    expect(ids).toContain('spot-dodge')
    expect(ids).toContain('misc-effect')
  })
})
