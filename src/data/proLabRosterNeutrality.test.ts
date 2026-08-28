import { describe, expect, it } from 'vitest'
import { proCoverageWorkQueue, proRosterReviewFighterPriority } from './proLab'
import { roster } from './roster'

/**
 * Regression guard for the project's roster-neutral policy: allocation must be
 * driven by the shared coverage queue, never a character-specific pilot list.
 */
describe('Pro Lab roster-neutral prioritization', () => {
  it('derives review fighter priority exactly from the full coverage queue', () => {
    expect(proRosterReviewFighterPriority).toEqual(proCoverageWorkQueue.map((item) => item.fighterId))
    expect(new Set(proRosterReviewFighterPriority)).toEqual(new Set(roster.map((fighter) => fighter.id)))
    expect(proRosterReviewFighterPriority).toHaveLength(roster.length)
  })
})
