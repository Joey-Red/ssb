import { describe, expect, it } from 'vitest'
import {
  proAcquisitionCoverageDistributionAudit,
  proCoverageDistributionAudit,
  proIndexedCoverageSelection,
  proRosterAcquisitionCoverage,
  proRosterCoverage,
  proVodCatalog,
} from './proLab'
import {
  proIndexedCoverageCatalog,
  proSideNeutralIndexedCoverageCatalog,
} from './proLabIndexedCoverageAll'
import { proIndexedCoverageM73D } from './proLabIndexedCoverageM73D'

describe('Pro Lab source-indexed coverage depth', () => {
  it('keeps indexed acquisition evidence separate, unique, and source-backed', () => {
    expect(new Set(proIndexedCoverageCatalog.map((entry) => entry.id)).size).toBe(proIndexedCoverageCatalog.length)
    expect(proIndexedCoverageCatalog.every((entry) => entry.evidenceStatus === 'source-index')).toBe(true)
    expect(proIndexedCoverageCatalog.every((entry) => entry.sourceUrls.length >= 2)).toBe(true)
    expect(proSideNeutralIndexedCoverageCatalog.every((entry) => entry.indexedFighterIds.length > 0)).toBe(true)
    expect(proSideNeutralIndexedCoverageCatalog.every((entry) =>
      entry.playerFighterIds.length === 0 && entry.opponentFighterIds.length === 0,
    )).toBe(true)

    expect(
      proIndexedCoverageSelection.accepted.length + proIndexedCoverageSelection.duplicateIds.length,
    ).toBe(proIndexedCoverageCatalog.length)
    expect(new Set(proIndexedCoverageSelection.duplicateIds).size).toBe(proIndexedCoverageSelection.duplicateIds.length)
    const acceptedIds = new Set(proIndexedCoverageSelection.accepted.map((entry) => entry.id))
    expect(proIndexedCoverageM73D.every((entry) => acceptedIds.has(entry.id))).toBe(true)

    const directVodIds = new Set(proVodCatalog.map((vod) => vod.id))
    expect(proIndexedCoverageCatalog.every((entry) => !directVodIds.has(entry.id))).toBe(true)
  })

  it('improves acquisition planning without promoting direct evidence maturity', () => {
    const directByFighter = new Map(proRosterCoverage.map((entry) => [entry.fighterId, entry]))

    for (const projected of proRosterAcquisitionCoverage) {
      const direct = directByFighter.get(projected.fighterId)
      expect(direct, projected.fighterId).toBeDefined()
      if (!direct) continue

      expect(projected.state, projected.fighterId).toBe(direct.state)
      expect(projected.vodCount, projected.fighterId).toBeGreaterThanOrEqual(direct.vodCount)
      expect(projected.currentVodCount, projected.fighterId).toBeGreaterThanOrEqual(direct.currentVodCount)
    }

    expect(proAcquisitionCoverageDistributionAudit.fighterCount).toBe(89)
    expect(proAcquisitionCoverageDistributionAudit.severeVodDeficitCount).toBeLessThan(
      proCoverageDistributionAudit.severeVodDeficitCount,
    )
    expect(proIndexedCoverageM73D).toHaveLength(30)
    expect(proAcquisitionCoverageDistributionAudit.severeVodDeficitCount).toBe(0)
    expect(proRosterAcquisitionCoverage.every((entry) => entry.vodCount >= 6)).toBe(true)
  })
})
