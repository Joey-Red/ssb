import { describe, expect, it } from 'vitest'
import { proZeroVodCoverageStats, proZeroVodFighterIds } from './proLabCoverageGapBacklog'
import { proCoverageWorkQueue } from './proLab'

describe('derived Pro Lab zero-VOD backlog', () => {
  it('reaches zero without changing the shared all-roster work queue', () => {
    expect(proZeroVodFighterIds).toEqual([])
    expect(proZeroVodCoverageStats.uncoveredFighters).toBe(0)
    expect(proCoverageWorkQueue).toHaveLength(89)
  })
})
