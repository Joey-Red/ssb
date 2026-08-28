import { describe, expect, it } from 'vitest'
import { proZeroVodCoverageStats, proZeroVodFighterIds } from './proLabCoverageGapBacklog'

describe('full-roster Pro Lab VOD completeness', () => {
  it('has at least one direct source-backed Pro Lab VOD for every fighter', () => {
    expect(proZeroVodCoverageStats).toEqual({
      coveredFighters: 89,
      uncoveredFighters: 0,
      totalFighters: 89,
    })
    expect(proZeroVodFighterIds).toEqual([])
  })
})
