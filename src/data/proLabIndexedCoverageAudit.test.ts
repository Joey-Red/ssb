import { describe, expect, it } from 'vitest'
import { applyIndexedCoverageDepth, selectUniqueIndexedCoverageSets } from '../lib/proLabIndexedCoverage'
import {
  proLabReferenceDate,
  proPlayerRepresentatives,
  proRosterCoverage,
  proVodCatalog,
} from './proLab'
import { proIndexedCoverageDepth } from './proLabIndexedCoverageDepth'

describe('Pro Lab source-indexed coverage depth', () => {
  it('keeps indexed planning evidence separate, unique, and measurable', () => {
    const selection = selectUniqueIndexedCoverageSets(
      proVodCatalog,
      proPlayerRepresentatives,
      proIndexedCoverageDepth,
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
      indexedTotal: proIndexedCoverageDepth.length,
      accepted: selection.accepted.length,
      duplicates: selection.duplicateIds,
      severe,
    })}`)

    expect(new Set(proIndexedCoverageDepth.map((entry) => entry.id)).size).toBe(proIndexedCoverageDepth.length)
    expect(proIndexedCoverageDepth.every((entry) => entry.evidenceStatus === 'source-index')).toBe(true)
    expect(proIndexedCoverageDepth.every((entry) => entry.sourceUrls.length >= 2)).toBe(true)
  })
})
