import { describe, expect, it } from 'vitest'
import { proZeroVodCoverageStats, proZeroVodFighterIds } from './proLabCoverageGapBacklog'

describe('full-roster Pro Lab VOD completeness', () => {
  it('tracks the remaining zero-VOD backlog without hiding incomplete fighters', () => {
    expect(proZeroVodCoverageStats).toEqual({
      coveredFighters: 88,
      uncoveredFighters: 1,
      totalFighters: 89,
    })
    expect(proZeroVodFighterIds).toEqual(['simon'])
  })
})
