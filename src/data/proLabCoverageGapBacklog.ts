import { roster } from './roster'
import { getProVodsForFighter } from './proLabVodsAll'

/**
 * Exact remaining zero-VOD backlog derived from the live corpus. This is data,
 * not a preference list: any fighter disappears automatically once a direct,
 * source-backed Pro Lab VOD is added.
 */
export const proZeroVodFighterIds = roster
  .filter((fighter) => getProVodsForFighter(fighter.id).length === 0)
  .map((fighter) => fighter.id)
  .sort()

export const proZeroVodCoverageStats = {
  coveredFighters: roster.length - proZeroVodFighterIds.length,
  uncoveredFighters: proZeroVodFighterIds.length,
  totalFighters: roster.length,
} as const
