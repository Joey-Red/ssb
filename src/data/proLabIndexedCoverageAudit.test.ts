import { describe, expect, it } from 'vitest'
import { applyIndexedCoverageDepth, selectUniqueIndexedCoverageSets } from '../lib/proLabIndexedCoverage'
import {
  proLabReferenceDate,
  proPlayerRepresentatives,
  proRosterCoverage,
  proVodCatalog,
} from './proLab'
import { proIndexedCoverageDepth } from './proLabIndexedCoverageDepth'
import { proIndexedCoverageM73A } from './proLabIndexedCoverageM73A'

const indexedCoverage = [...proIndexedCoverageDepth, ...proIndexedCoverageM73A]

describe('Pro Lab source-indexed coverage depth', () => {
  it('keeps indexed planning evidence separate, unique, and measurable', () => {
    const selection = selectUniqueIndexedCoverageSets(
      proVodCatalog,
      proPlayerRepresentatives,
      indexedCoverage,
    )
    const projectedCoverage = applyIndexedCoverageDepth(
      proRosterCoverage,
      selection.accepted,
      proLabReferenceDate,
    )
    const severe = projectedCoverage
      .filter((entry) => entry.vodCount < 6)
      .map((entry) => ({
        fighterId: entry.fighterId,
        vodCount: entry.vodCount,
        currentVodCount: entry.currentVodCount,
      }))

    console.log(`M73_INDEXED_COVERAGE=${JSON.stringify({
      indexedTotal: indexedCoverage.length,
      accepted: selection.accepted.length,
      duplicates: selection.duplicateIds,
      severe,
    })}`)

    expect(new Set(indexedCoverage.map((entry) => entry.id)).size).toBe(indexedCoverage.length)
    expect(indexedCoverage.every((entry) => entry.evidenceStatus === 'source-index')).toBe(true)
    expect(indexedCoverage.every((entry) => entry.sourceUrls.length >= 2)).toBe(true)
    expect(proIndexedCoverageM73A.every((entry) => entry.indexedFighterIds.length > 0)).toBe(true)
    expect(proIndexedCoverageM73A.every((entry) => entry.playerFighterIds.length === 0 && entry.opponentFighterIds.length === 0)).toBe(true)
  })
})
