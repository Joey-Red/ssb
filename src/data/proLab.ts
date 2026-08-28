import { extractProPatterns } from '../lib/proLab'
import { auditExpandedProLabCatalog } from '../lib/proLabAudit'
import { buildAnnotationWorksheet } from '../lib/proLabAutomation'
import { buildProCoverageWorkQueue } from '../lib/proLabCoveragePlanning'
import { compileProEvidenceRegistry } from '../lib/proLabEvidenceRegistry'
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
import { proVodReviewQueue as proVodReviewQueueSource } from './proLabReviewQueueAll'
import { proReviewedSubmissions } from './proLabReviewedSubmissions'
import { proFighterResearchRegistry, proPlayerRepresentatives } from './proLabRosterAll'
import { proVodCatalogWithCoverageGaps as proVodSourceCatalog } from './proLabVodsAll'

export const proLabReferenceDate = '2026-08-27'

/**
 * Production tactical content is compiled exclusively from checked-in review
 * submissions that pass the same strict intake gate used by the browser review
 * workbench. Invalid submissions fail closed and cannot leak into teaching data.
 */
export const proEvidenceRegistry = compileProEvidenceRegistry(
  proReviewedSubmissions,
  proVodSourceCatalog,
  roster.map((fighter) => fighter.id),
)

export const proVodCatalog = proEvidenceRegistry.vods
export const proDecisionMoments = proEvidenceRegistry.moments
export const proSetBreakdowns = proEvidenceRegistry.breakdowns

const proVodStatusById = new Map(proVodCatalog.map((vod) => [vod.id, vod.analysisStatus]))
export const proVodReviewQueue = proVodReviewQueueSource.map((target) => {
  const status = target.vodId ? proVodStatusById.get(target.vodId) : undefined
  return status === 'reviewed' ? { ...target, status: 'reviewed' as const } : target
})

export const proVodReviewQueueStats = {
  totalTargets: proVodReviewQueue.length,
  critical: proVodReviewQueue.filter((target) => target.priority === 'critical').length,
  high: proVodReviewQueue.filter((target) => target.priority === 'high').length,
  normal: proVodReviewQueue.filter((target) => target.priority === 'normal').length,
  reviewed: proVodReviewQueue.filter((target) => target.status === 'reviewed').length,
  pending: proVodReviewQueue.filter((target) => target.status !== 'reviewed').length,
  identityCount: new Set(proVodReviewQueue.map((target) =>
    target.vodId
      ? `vod:${target.vodId}`
      : `media:${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`,
  )).size,
} as const

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

/**
 * Review allocation is intentionally roster-neutral. Fighters are ordered only
 * by the evidence/coverage work queue, then each gets its highest-ranked
 * primary-side VOD that has not already been selected. No character receives a
 * hard-coded pilot boost or user-preference bonus.
 */
export const proRosterReviewFighterPriority = proCoverageWorkQueue.map((item) => item.fighterId)

const proVodByIdForReview = new Map(proVodCatalog.map((vod) => [vod.id, vod]))
const selectedRosterReviewVodIds = new Set<string>()
const rosterReviewTargets = [] as (typeof proRankedVodReviewPlan)[number][]

for (const fighterId of proRosterReviewFighterPriority) {
  if (rosterReviewTargets.length >= 16) break
  const target = proRankedVodReviewPlan.find((candidate) => {
    if (selectedRosterReviewVodIds.has(candidate.vodId)) return false
    const vod = proVodByIdForReview.get(candidate.vodId)
    return vod?.playerFighterIds.includes(fighterId) ?? false
  })
  if (!target) continue
  selectedRosterReviewVodIds.add(target.vodId)
  rosterReviewTargets.push(target)
}

export const proRosterReviewBatch = rosterReviewTargets.map((target, index) => ({
  ...target,
  rank: index + 1,
}))

export const proRosterReviewWorksheets = proRosterReviewBatch.flatMap((target) => {
  const vod = proVodByIdForReview.get(target.vodId)
  return vod ? [buildAnnotationWorksheet(vod)] : []
})

export const proRosterReviewSubmissionTemplates = proRosterReviewBatch.flatMap((target) => {
  const vod = proVodByIdForReview.get(target.vodId)
  return vod ? [buildProReviewSubmissionTemplate(vod)] : []
})

const proRosterReviewVods = proRosterReviewBatch.flatMap((target) => {
  const vod = proVodByIdForReview.get(target.vodId)
  return vod ? [vod] : []
})

export const proRosterReviewBatchStats = {
  targetCount: proRosterReviewBatch.length,
  primaryFighterIds: [...new Set(proRosterReviewVods.flatMap((vod) => vod.playerFighterIds))].sort(),
  primaryFighterCount: new Set(proRosterReviewVods.flatMap((vod) => vod.playerFighterIds)).size,
  representativePlayerCount: new Set(proRosterReviewVods.map((vod) => vod.playerId)).size,
  opponentFighterCount: new Set(proRosterReviewVods.flatMap((vod) => vod.opponentFighterIds)).size,
  reviewedSetCount: proRosterReviewVods.filter((vod) => vod.analysisStatus === 'reviewed').length,
} as const

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
  reviewedReviewTargets: proVodReviewQueueStats.reviewed,
  checkedInReviewSubmissions: proEvidenceRegistry.sourceSubmissionCount,
  acceptedReviewSubmissions: proEvidenceRegistry.acceptedSubmissions.length,
  rejectedReviewSubmissions: proEvidenceRegistry.rejectedSubmissions.length,
  evidenceRegistryErrors: proEvidenceRegistry.errors.length,
  evidenceRegistryWarnings: proEvidenceRegistry.warnings.length,
  rankedReviewTargets: proRankedVodReviewPlan.length,
  coverageWorkItems: proCoverageWorkQueue.length,
  rosterReviewTargets: proRosterReviewBatch.length,
  rosterReviewPrimaryFighters: proRosterReviewBatchStats.primaryFighterCount,
  rosterReviewRepresentatives: proRosterReviewBatchStats.representativePlayerCount,
  rosterReviewOpponentFighters: proRosterReviewBatchStats.opponentFighterCount,
  rosterReviewWorksheets: proRosterReviewWorksheets.length,
  rosterReviewSubmissionTemplates: proRosterReviewSubmissionTemplates.length,
  currentMetaResearchTargets: proMetaRepresentation2026.length,
  currentMetaTargetsNeedingRepresentative: nextProMetaResearchTargets2026.length,
  reviewedMoments: proDecisionMoments.filter((moment) => moment.evidenceClass !== 'speculative' && moment.confidence >= 0.65).length,
  lessonClaims: proCharacterLessons.reduce((total, lesson) => total + lesson.claims.length, 0),
  decisionExercises: proDecisionExercises.length,
  matchupPatterns: proMatchupPatterns.length,
  playerComparisons: proPlayerComparisons.length,
  teachingReadyFighters: proRosterCoverage.filter((entry) => entry.state === 'teaching-ready').length,
  catalogedFighters: roster.length - proMaintenanceReport.fightersWithoutCatalogedVods.length,
  phase2ValidationErrors: proEvidenceRegistry.errors.length + proDecisionMomentValidation.errors.length + proSetBreakdownValidation.errors.length,
  phase2ValidationWarnings: proEvidenceRegistry.warnings.length + proDecisionMomentValidation.warnings.length + proSetBreakdownValidation.warnings.length,
} as const

export {
  nextProMetaResearchTargets2026,
  proFighterResearchRegistry,
  proMetaRepresentation2026,
  proMetaResearchPriorities2026,
  proPlayerRepresentatives,
}
