import { buildSetBreakdown, extractProPatterns } from '../lib/proLab'
import { auditExpandedProLabCatalog } from '../lib/proLabAudit'
import {
  buildAnnotationWorksheet,
  buildPrimaryFighterReviewBatch,
  summarizeFighterEvidenceProgress,
} from '../lib/proLabAutomation'
import { buildProCoverageWorkQueue } from '../lib/proLabCoveragePlanning'
import {
  buildCharacterLessons,
  buildDecisionExercises,
  buildPlayerComparisons,
  buildProRosterCoverage,
  buildTemporalEvidenceIndex,
  extractMatchupPatterns,
} from '../lib/proLabRelease'
import { buildProReviewSubmissionTemplate } from '../lib/proLabReviewIntake'
import {
  buildProReviewPlan,
  summarizeProCoverage,
  validateDecisionMoments,
  validateSetBreakdowns,
} from '../lib/proLabPhase2'
import { roster } from './roster'
import {
  nextProMetaResearchTargets2026,
  proMetaRepresentation2026,
  proMetaResearchPriorities2026,
} from './proLabResearchPriorities'
import { proVodReviewQueue, proVodReviewQueueStats } from './proLabReviewQueueAll'
import { proFighterResearchRegistry, proLabPilotFighterIds, proPlayerRepresentatives } from './proLabRosterAll'
import type { ProDecisionMoment } from './proLabTypes'
import { proVodCatalog } from './proLabVodsAll'

/**
 * Tactical annotations stay empty until the gameplay has actually been
 * inspected. VOD metadata alone is not enough to invent a player's decisions,
 * reasons, adaptation patterns, frame-data dependency, or matchup plan.
 *
 * Phase 2 consumes this array through evidence-gated builders and validators.
 * As reviewed annotations are added, lessons, exercises, matchup patterns,
 * player comparisons, frame-data references, and drill actions become
 * available automatically without weakening the evidence policy.
 */
export const proDecisionMoments: readonly ProDecisionMoment[] = []

export const proLabReferenceDate = '2026-08-27'

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

export const proMaintenanceReport = auditExpandedProLabCatalog(
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

export const proCoverageSummary = summarizeProCoverage(proRosterCoverage)
export const proCoverageWorkQueue = buildProCoverageWorkQueue(proRosterCoverage, proDecisionMoments)

export const proRankedVodReviewPlan = buildProReviewPlan(
  proVodCatalog,
  proRosterCoverage,
)

export const proAegisPilotReviewTargets = buildProReviewPlan(
  proVodCatalog,
  proRosterCoverage,
  {
    fighterFilter: ['pyra', 'mythra'],
    focusFighterIds: ['pyra', 'mythra'],
    limit: 12,
  },
)

export const proAegisPilotReviewBatch = buildPrimaryFighterReviewBatch(
  proAegisPilotReviewTargets,
  proVodCatalog,
  ['pyra', 'mythra'],
  8,
)

const proVodByIdForReview = new Map(proVodCatalog.map((vod) => [vod.id, vod]))
export const proAegisPilotWorksheets = proAegisPilotReviewBatch.flatMap((target) => {
  const vod = proVodByIdForReview.get(target.vodId)
  return vod ? [buildAnnotationWorksheet(vod)] : []
})

export const proAegisPilotSubmissionTemplates = proAegisPilotReviewBatch.flatMap((target) => {
  const vod = proVodByIdForReview.get(target.vodId)
  return vod ? [buildProReviewSubmissionTemplate(vod)] : []
})

export const proAegisPilotProgress = summarizeFighterEvidenceProgress(
  ['pyra', 'mythra'],
  proVodCatalog,
  proDecisionMoments,
  8,
)

export const proDecisionMomentValidation = validateDecisionMoments(
  proDecisionMoments,
  proVodCatalog,
  roster.map((fighter) => fighter.id),
)

export const proSetBreakdownValidation = validateSetBreakdowns(
  proSetBreakdowns,
  proDecisionMoments,
  proVodCatalog,
)

export const proLabReleaseStats = {
  fighters: proRosterCoverage.length,
  representatives: proPlayerRepresentatives.length,
  seededResearchFighters: proFighterResearchRegistry.filter((entry) => entry.status === 'seeded').length,
  vodLearningRecords: proVodCatalog.length,
  distinctVideos: new Set(proVodCatalog.map((vod) => vod.videoUrl)).size,
  reviewTargets: proVodReviewQueueStats.totalTargets,
  pendingReviewTargets: proVodReviewQueueStats.pending,
  rankedReviewTargets: proRankedVodReviewPlan.length,
  coverageWorkItems: proCoverageWorkQueue.length,
  aegisPilotReviewTargets: proAegisPilotReviewTargets.length,
  aegisPrimaryPilotTargets: proAegisPilotReviewBatch.length,
  aegisPilotWorksheets: proAegisPilotWorksheets.length,
  aegisPilotSubmissionTemplates: proAegisPilotSubmissionTemplates.length,
  aegisPilotReviewedSets: proAegisPilotProgress.reviewedSetCount,
  currentMetaResearchTargets: proMetaRepresentation2026.length,
  currentMetaTargetsNeedingRepresentative: nextProMetaResearchTargets2026.length,
  reviewedMoments: proDecisionMoments.filter((moment) => moment.evidenceClass !== 'speculative' && moment.confidence >= 0.65).length,
  lessonClaims: proCharacterLessons.reduce((total, lesson) => total + lesson.claims.length, 0),
  decisionExercises: proDecisionExercises.length,
  matchupPatterns: proMatchupPatterns.length,
  playerComparisons: proPlayerComparisons.length,
  teachingReadyFighters: proRosterCoverage.filter((entry) => entry.state === 'teaching-ready').length,
  catalogedFighters: roster.length - proMaintenanceReport.fightersWithoutCatalogedVods.length,
  phase2ValidationErrors: proDecisionMomentValidation.errors.length + proSetBreakdownValidation.errors.length,
  phase2ValidationWarnings: proDecisionMomentValidation.warnings.length + proSetBreakdownValidation.warnings.length,
} as const

export {
  nextProMetaResearchTargets2026,
  proFighterResearchRegistry,
  proLabPilotFighterIds,
  proMetaRepresentation2026,
  proMetaResearchPriorities2026,
  proPlayerRepresentatives,
  proVodCatalog,
  proVodReviewQueue,
  proVodReviewQueueStats,
}
