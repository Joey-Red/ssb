import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { getProVodsForFighter } from './proLabVodsAll'

describe('full-roster Pro Lab VOD completeness', () => {
  it('has at least one provenance-backed competitive VOD for every fighter', () => {
    const uncoveredFighterIds = roster
      .filter((fighter) => getProVodsForFighter(fighter.id).length === 0)
      .map((fighter) => fighter.id)
      .sort()

    expect(uncoveredFighterIds).toEqual([])
  })
})
