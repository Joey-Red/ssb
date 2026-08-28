import { proIndexedCoverageDepth } from './proLabIndexedCoverageDepth'
import { proIndexedCoverageM73A } from './proLabIndexedCoverageM73A'
import { proIndexedCoverageM73B } from './proLabIndexedCoverageM73B'
import { proIndexedCoverageM73C } from './proLabIndexedCoverageM73C'

/**
 * Source-indexed match-video evidence used only to prioritize acquisition work.
 * These entries are intentionally separate from the direct reviewed VOD catalog.
 */
export const proIndexedCoverageCatalog = [
  ...proIndexedCoverageDepth,
  ...proIndexedCoverageM73A,
  ...proIndexedCoverageM73B,
  ...proIndexedCoverageM73C,
] as const

/** Character-index rows where the public source confirms the fighter, not its side. */
export const proSideNeutralIndexedCoverageCatalog = [
  ...proIndexedCoverageM73A,
  ...proIndexedCoverageM73B,
  ...proIndexedCoverageM73C,
] as const
