import { describe, expect, it } from 'vitest'
import { proCoverageDistributionAudit, proRosterCoverage, proVodCatalog } from './proLab'
import { roster } from './roster'

describe('Pro Lab fighter-side coverage semantics', () => {
  it('counts a cataloged set for either confirmed fighter side without double counting the record', () => {
    const coverageByFighter = new Map(proRosterCoverage.map((entry) => [entry.fighterId, entry]))

    for (const fighter of roster) {
      const expectedVodIds = new Set(
        proVodCatalog
          .filter((vod) => vod.playerFighterIds.includes(fighter.id) || vod.opponentFighterIds.includes(fighter.id))
          .map((vod) => vod.id),
      )
      expect(coverageByFighter.get(fighter.id)?.vodCount, fighter.id).toBe(expectedVodIds.size)
    }
  })

  it('keeps M71 direct roster coverage and M72 planning coverage consistent', () => {
    expect(proCoverageDistributionAudit.fighterCount).toBe(89)
    expect(proCoverageDistributionAudit.zeroVodFighterCount).toBe(0)
    expect(proRosterCoverage.every((entry) => entry.vodCount > 0)).toBe(true)
  })
})
