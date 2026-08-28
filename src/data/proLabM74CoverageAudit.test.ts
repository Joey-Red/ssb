import { describe, expect, it } from 'vitest'
import {
  proAcquisitionCoverageDistributionAudit,
  proIndexedCoverageSelection,
  proRosterAcquisitionCoverage,
} from './proLab'
import { proIndexedCoverageM74A } from './proLabIndexedCoverageM74A'

describe('M74 roster-wide 12-set acquisition floor', () => {
  it('closes the first pair-efficient fighter tier without bypassing evidence rules', () => {
    expect(proIndexedCoverageM74A).toHaveLength(6)
    expect(proIndexedCoverageM74A.every((entry) => entry.evidenceStatus === 'source-index')).toBe(true)
    expect(proIndexedCoverageM74A.every((entry) =>
      entry.playerFighterIds.length === 0 && entry.opponentFighterIds.length === 0,
    )).toBe(true)

    const acceptedIds = new Set(proIndexedCoverageSelection.accepted.map((entry) => entry.id))
    expect(proIndexedCoverageM74A.every((entry) => acceptedIds.has(entry.id))).toBe(true)

    const byFighter = new Map(proRosterAcquisitionCoverage.map((entry) => [entry.fighterId, entry]))
    expect(byFighter.get('bowser-jr')?.vodCount).toBeGreaterThanOrEqual(12)
    expect(byFighter.get('ike')?.vodCount).toBeGreaterThanOrEqual(12)
    expect(proAcquisitionCoverageDistributionAudit.vodFloorMetCount).toBeGreaterThanOrEqual(42)
    expect(proAcquisitionCoverageDistributionAudit.totalVodGap).toBeLessThanOrEqual(256)
    expect(proAcquisitionCoverageDistributionAudit.severeVodDeficitCount).toBe(0)
  })
})
