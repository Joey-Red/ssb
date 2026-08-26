import { buildSetBreakdown, extractProPatterns } from '../lib/proLab'
import type { ProDecisionMoment } from './proLabTypes'
import { proFighterResearchRegistry, proLabPilotFighterIds, proPlayerRepresentatives } from './proLabRoster'
import { proVodCatalog } from './proLabVods'

/**
 * Tactical annotations are intentionally empty until a reviewer has inspected
 * the relevant gameplay. VOD metadata alone is not enough to invent a player's
 * decisions, reasons, or adaptation patterns.
 */
export const proDecisionMoments: readonly ProDecisionMoment[] = []

export const proSetBreakdowns = proVodCatalog.map((vod) =>
  buildSetBreakdown(vod.id, proDecisionMoments),
)

const playerIdByVod = Object.fromEntries(proVodCatalog.map((vod) => [vod.id, vod.playerId]))

export const proPatternSummaries = extractProPatterns(proDecisionMoments, {
  playerIdByVod,
})

export {
  proFighterResearchRegistry,
  proLabPilotFighterIds,
  proPlayerRepresentatives,
  proVodCatalog,
}
