import { describe, expect, it } from 'vitest'
import { proZeroVodCoverageStats, proZeroVodFighterIds } from './proLabCoverageGapBacklog'
import { proCoverageWorkQueue } from './proLab'

describe('derived Pro Lab zero-VOD backlog', () => {
  it('keeps the sole unresolved fighter visible in the shared work queue', () => {
    expect(proZeroVodFighterIds).toEqual(['simon'])
    expect(proZeroVodCoverageStats.uncoveredFighters).toBe(1)
    expect(proCoverageWorkQueue.some((item) => item.fighterId === 'simon')).toBe(true)
  })
})
