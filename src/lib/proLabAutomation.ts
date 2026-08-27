import type {
  DecisionContext,
  ProDecisionMoment,
  ProSetBreakdown,
  ProVodAnalysisStatus,
  ProVodRecord,
} from '../data/proLabTypes'
import { isTeachingEligibleMoment } from './proLab'
import type {
  ProRankedVodReviewTarget,
  ProReviewValidationIssue,
  ProReviewValidationReport,
} from './proLabPhase2'

export type ProAnnotationWorksheetStatus = 'gameplay-observations-pending'
export type ProEvidenceSamplingStatus = 'review-not-started' | 'building' | 'sampling-target-met'

export interface ProAnnotationWorksheet {
  readonly vodId: string
  readonly title: string
  readonly event: string
  readonly date: string
  readonly round: string
  readonly playerId: string
  readonly playerFighterIds: readonly string[]
  readonly opponentTag: string
  readonly opponentFighterIds: readonly string[]
  readonly videoUrl: string
  readonly videoProvider: ProVodRecord['videoProvider']
  readonly startSeconds?: number
  readonly endSeconds?: number
  readonly sourceUrls: readonly string[]
  readonly status: ProAnnotationWorksheetStatus
  readonly checklist: readonly string[]
}

export interface ProFighterEvidenceProgress {
  readonly fighterIds: readonly string[]
  readonly samplingSetTarget: number
  readonly availablePrimaryVodCount: number
  readonly reviewedSetCount: number
  readonly reviewedSetIds: readonly string[]
  readonly representativePlayerCount: number
  readonly opponentFighterCount: number
  readonly contextCount: number
  readonly teachingTagCount: number
  readonly status: ProEvidenceSamplingStatus
}

const unique = (values: readonly string[]) => [...new Set(values)]

const worksheetChecklist = [
  'Confirm the game boundary and timestamp from visible gameplay before recording a moment.',
  'Record the chosen action and observable outcome before writing any interpretation.',
  'Classify inference strength explicitly; never promote speculation into teaching material.',
  'Attach fighter and opponent IDs only when the footage confirms the character usage.',
  'Attach frame-data references only when the committed move row resolves.',
  'Do not mark the set reviewed until the reviewed breakdown and evidence both exist.',
] as const

const targetPrimaryIncludes = (
  vod: ProVodRecord,
  fighterIds: ReadonlySet<string>,
) => vod.playerFighterIds.some((fighterId) => fighterIds.has(fighterId))

/**
 * Builds a compact pilot batch from an already-ranked queue, but only when the
 * requested fighter appears on the cataloged player's side. This matters
 * because ProDecisionMoment.fighterId describes that reviewed player, not the
 * opponent. Diversity bonuses reduce repeated-player/opponent sampling without
 * changing any source metadata or pretending the footage has been reviewed.
 */
export function buildPrimaryFighterReviewBatch(
  targets: readonly ProRankedVodReviewTarget[],
  vods: readonly ProVodRecord[],
  fighterIds: readonly string[],
  limit = 8,
): readonly ProRankedVodReviewTarget[] {
  const desired = new Set(fighterIds)
  const vodById = new Map(vods.map((vod) => [vod.id, vod]))
  const candidates = targets
    .map((target) => ({ target, vod: vodById.get(target.vodId) }))
    .filter((entry): entry is { target: ProRankedVodReviewTarget; vod: ProVodRecord } =>
      entry.vod !== undefined && targetPrimaryIncludes(entry.vod, desired),
    )

  const selected: { target: ProRankedVodReviewTarget; vod: ProVodRecord }[] = []
  const remaining = [...candidates]
  const players = new Set<string>()
  const opponents = new Set<string>()
  const opponentFighters = new Set<string>()
  const videos = new Set<string>()
  const wanted = Math.max(0, Math.floor(limit))

  while (selected.length < wanted && remaining.length > 0) {
    const adjustedScore = (entry: { target: ProRankedVodReviewTarget; vod: ProVodRecord }) => {
      const opponentKey = entry.vod.opponentTag.trim().toLowerCase()
      const unseenOpponentFighters = entry.vod.opponentFighterIds.filter((id) => !opponentFighters.has(id)).length
      return entry.target.score
        + (players.has(entry.vod.playerId) ? 0 : 180)
        + (opponents.has(opponentKey) ? 0 : 70)
        + unseenOpponentFighters * 35
        + (videos.has(entry.vod.videoUrl) ? 0 : 15)
    }

    remaining.sort((a, b) =>
      adjustedScore(b) - adjustedScore(a)
      || b.target.score - a.target.score
      || b.target.date.localeCompare(a.target.date)
      || a.target.vodId.localeCompare(b.target.vodId),
    )
    const next = remaining.shift()
    if (!next) break
    selected.push(next)
    players.add(next.vod.playerId)
    opponents.add(next.vod.opponentTag.trim().toLowerCase())
    next.vod.opponentFighterIds.forEach((fighterId) => opponentFighters.add(fighterId))
    videos.add(next.vod.videoUrl)
  }

  return selected.map(({ target }, index) => ({ ...target, rank: index + 1 }))
}

/** Metadata-only worksheet. It deliberately has no tactical action fields. */
export function buildAnnotationWorksheet(vod: ProVodRecord): ProAnnotationWorksheet {
  return {
    vodId: vod.id,
    title: vod.title,
    event: vod.event,
    date: vod.date,
    round: vod.round,
    playerId: vod.playerId,
    playerFighterIds: vod.playerFighterIds,
    opponentTag: vod.opponentTag,
    opponentFighterIds: vod.opponentFighterIds,
    videoUrl: vod.videoUrl,
    videoProvider: vod.videoProvider,
    ...(vod.startSeconds === undefined ? {} : { startSeconds: vod.startSeconds }),
    ...(vod.endSeconds === undefined ? {} : { endSeconds: vod.endSeconds }),
    sourceUrls: vod.sourceUrls,
    status: 'gameplay-observations-pending',
    checklist: worksheetChecklist,
  }
}

const statusOrder: Readonly<Record<ProVodAnalysisStatus, number>> = {
  cataloged: 0,
  'review-queued': 1,
  annotated: 2,
  reviewed: 3,
}

const transitionReport = (issues: readonly ProReviewValidationIssue[]): ProReviewValidationReport => {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  return { issues, errors, warnings, valid: errors.length === 0 }
}

export function validateVodAnalysisTransition(
  vod: ProVodRecord,
  nextStatus: ProVodAnalysisStatus,
  moments: readonly ProDecisionMoment[],
  breakdown?: ProSetBreakdown,
): ProReviewValidationReport {
  const issues: ProReviewValidationIssue[] = []
  const add = (code: string, severity: ProReviewValidationIssue['severity'], message: string) => {
    issues.push({ code, severity, recordId: vod.id, message })
  }
  const currentRank = statusOrder[vod.analysisStatus]
  const nextRank = statusOrder[nextStatus]
  const eligible = moments.filter((moment) => moment.vodId === vod.id && isTeachingEligibleMoment(moment))

  if (nextRank < currentRank) add('analysis-status-regression', 'error', 'Analysis status cannot move backward.')
  if (nextRank > currentRank + 1) add('analysis-status-skip', 'error', 'Analysis status cannot skip an evidence gate.')

  if ((vod.linkKind === 'source-index' || !vod.quality.visibleGameplay) && nextStatus !== 'cataloged') {
    add('unreviewable-footage', 'error', 'Gameplay review cannot advance without direct visible footage.')
  }
  if (nextStatus === 'review-queued' && (vod.linkKind === 'source-index' || !vod.quality.visibleGameplay)) {
    add('review-queue-without-footage', 'error', 'Review queue requires direct visible gameplay.')
  }
  if ((nextStatus === 'annotated' || nextStatus === 'reviewed') && eligible.length === 0) {
    add('analysis-without-eligible-evidence', 'error', `${nextStatus} status requires at least one teaching-eligible reviewed moment.`)
  }
  if (nextStatus === 'reviewed') {
    if (!breakdown || breakdown.vodId !== vod.id) {
      add('reviewed-without-breakdown', 'error', 'Reviewed status requires a set breakdown for the same VOD.')
    } else if (breakdown.status !== 'reviewed') {
      add('reviewed-without-reviewed-breakdown', 'error', 'The set breakdown must itself be reviewed before the VOD is reviewed.')
    }
  }

  return transitionReport(issues)
}

/**
 * Review-diversity heuristic only. Meeting this sampling target does NOT make a
 * fighter teaching-ready; the normal evidence/lesson gates remain authoritative.
 */
export function summarizeFighterEvidenceProgress(
  fighterIds: readonly string[],
  vods: readonly ProVodRecord[],
  moments: readonly ProDecisionMoment[],
  samplingSetTarget = 8,
): ProFighterEvidenceProgress {
  const desired = new Set(fighterIds)
  const primaryVods = vods.filter((vod) =>
    vod.linkKind !== 'source-index'
    && vod.quality.visibleGameplay
    && targetPrimaryIncludes(vod, desired),
  )
  const primaryVodIds = new Set(primaryVods.map((vod) => vod.id))
  const eligibleMoments = moments.filter((moment) =>
    desired.has(moment.fighterId)
    && primaryVodIds.has(moment.vodId)
    && isTeachingEligibleMoment(moment),
  )
  const reviewedSetIds = unique(eligibleMoments.map((moment) => moment.vodId)).sort()
  const reviewedIds = new Set(reviewedSetIds)
  const reviewedVods = primaryVods.filter((vod) => reviewedIds.has(vod.id))
  const representativePlayers = new Set(reviewedVods.map((vod) => vod.playerId))
  const opponentFighters = new Set(reviewedVods.flatMap((vod) => vod.opponentFighterIds))
  const contexts = new Set<DecisionContext>(eligibleMoments.map((moment) => moment.context))
  const teachingTags = new Set(
    eligibleMoments.flatMap((moment) => moment.teachingTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  )
  const target = Math.max(1, Math.floor(samplingSetTarget))
  const samplingTargetMet = reviewedSetIds.length >= target
    && representativePlayers.size >= 2
    && opponentFighters.size >= 4
    && contexts.size >= 3
  const status: ProEvidenceSamplingStatus = reviewedSetIds.length === 0
    ? 'review-not-started'
    : samplingTargetMet
      ? 'sampling-target-met'
      : 'building'

  return {
    fighterIds: unique(fighterIds),
    samplingSetTarget: target,
    availablePrimaryVodCount: primaryVods.length,
    reviewedSetCount: reviewedSetIds.length,
    reviewedSetIds,
    representativePlayerCount: representativePlayers.size,
    opponentFighterCount: opponentFighters.size,
    contextCount: contexts.size,
    teachingTagCount: teachingTags.size,
    status,
  }
}
