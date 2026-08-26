import { buildSetBreakdown, extractProPatterns } from '../lib/proLab'
import {
  auditProLabCatalog,
  buildCharacterLessons,
  buildDecisionExercises,
  buildPlayerComparisons,
  buildProRosterCoverage,
  buildTemporalEvidenceIndex,
  extractMatchupPatterns,
} from '../lib/proLabRelease'
import { roster } from './roster'
import type { ProDecisionMoment } from './proLabTypes'
import { proFighterResearchRegistry, proLabPilotFighterIds, proPlayerRepresentatives } from './proLabRoster'
import { proVodCatalog } from './proLabVods'

/**
 * Tactical annotations stay empty until a reviewer has inspected the relevant
 * gameplay. VOD metadata alone is not enough to invent a player's decisions,
 * reasons, adaptation patterns, frame-data dependency, or matchup plan.
 *
 * M81-M90 consume this array through evidence-gated builders. As reviewed
 * annotations are added later, lessons, exercises, matchup patterns, player
 * comparisons, frame-data references, and drill actions become available
 * automatically without weakening the evidence policy.
 */
export const proDecisionMoments: readonly ProDecisionMoment[] = []

export const proLabReferenceDate = '2026-08-26'

export const proSetBreakdowns = proVodCatalog.map((vod) =>
  buildSetBreakdown(vod.id, proDecisionMoments),
)

export const proPlayerIdByVod: Readonly<Record<string, string>> = Object.fromEntries(
  proVodCatalog.map((vod) => [vod.id, vod.playerId]),
)

export const proPatternSummaries = extractProPatterns(proDecisionMoments, {
  playerIdByVod: proPlayerIdByVod,
})

export const proCharacterLessons = buildCharacterLessons(
  roster.map((fighter) => fighter.id),
  proPatternSummaries,
  proDecisionMoments,
)

export const proDecisionExercises = buildDecisionExercises(proDecisionMoments)

export const proMatchupPatterns = extractMatchupPatterns(proDecisionMoments, {
  playerIdByVod: proPlayerIdByVod,
})

export const proPlayerComparisons = buildPlayerComparisons(
  proDecisionMoments,
  proPlayerIdByVod,
)

export const proTemporalEvidence = buildTemporalEvidenceIndex(
  proVodCatalog,
  proPlayerRepresentatives,
  proLabReferenceDate,
)

export const proMaintenanceReport = auditProLabCatalog(
  proVodCatalog,
  roster.map((fighter) => fighter.id),
  proTemporalEvidence,
  proLabReferenceDate,
)

export const proRosterCoverage = buildProRosterCoverage({
  fighterIds: roster.map((fighter) => fighter.id),
  research: proFighterResearchRegistry,
  players: proPlayerRepresentatives,
  vods: proVodCatalog,
  temporal: proTemporalEvidence,
  moments: proDecisionMoments,
  lessons: proCharacterLessons,
  exercises: proDecisionExercises,
  matchupPatterns: proMatchupPatterns,
  comparisons: proPlayerComparisons,
})

export const proLabReleaseStats = {
  fighters: proRosterCoverage.length,
  representatives: proPlayerRepresentatives.length,
  vodLearningRecords: proVodCatalog.length,
  distinctVideos: new Set(proVodCatalog.map((vod) => vod.videoUrl)).size,
  reviewedMoments: proDecisionMoments.filter((moment) => moment.evidenceClass !== 'speculative' && moment.confidence >= 0.65).length,
  lessonClaims: proCharacterLessons.reduce((total, lesson) => total + lesson.claims.length, 0),
  decisionExercises: proDecisionExercises.length,
  matchupPatterns: proMatchupPatterns.length,
  playerComparisons: proPlayerComparisons.length,
  teachingReadyFighters: proRosterCoverage.filter((entry) => entry.state === 'teaching-ready').length,
  catalogedFighters: proRosterCoverage.filter((entry) => entry.vodCount > 0).length,
} as const

export {
  proFighterResearchRegistry,
  proLabPilotFighterIds,
  proPlayerRepresentatives,
  proVodCatalog,
}
