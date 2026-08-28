import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { getProVodsForFighter } from './proLabVodsAll'

describe('full-roster Pro Lab VOD completeness', () => {
  it('tracks the remaining zero-VOD backlog without hiding incomplete fighters', () => {
    const uncoveredFighterIds = roster
      .filter((fighter) => getProVodsForFighter(fighter.id).length === 0)
      .map((fighter) => fighter.id)
      .sort()

    expect(uncoveredFighterIds).toHaveLength(14)
    expect(new Set(uncoveredFighterIds).size).toBe(uncoveredFighterIds.length)
    expect(uncoveredFighterIds).toEqual([
      'chrom',
      'dark-pit',
      'ganondorf',
      'king-dedede',
      'lucario',
      'lucina',
      'marth',
      'mewtwo',
      'mii-gunner',
      'mii-swordfighter',
      'pichu',
      'pit',
      'simon',
      'zelda',
    ])
  })
})
