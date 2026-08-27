import type { FighterFrameData } from '../types'
import type {
  ProDecisionMoment,
  ProFighterCoverage,
  ProSetBreakdown,
  ProVodEventTier,
  ProVodRecord,
} from '../data/proLabTypes'
import { isTeachingEligibleMoment } from './proLab'

export type ProReviewValidationSeverity = 'warning' | 'error'

export interface ProReviewValidationIssue {
  readonly code: string
  readonly severity: ProReviewValidationSeverity
  readonly recordId: string
  readonly message: string
}

export interface ProReviewValidationReport {
  readonly issues: readonly ProReviewValidationIssue[]
  readonly errors: readonly ProReviewValidationIssue[]
  readonly warnings: readonly ProReviewValidationIssue[]
  readonly valid: boolean
}

export interface ProReviewPlanOptions {
  readonly fighterFilter?: readonly string[]
  readonly focusFighterIds?: readonly string[]
  readonly limit?: number
}

export interface ProRankedVodReviewTarget {
  readonly rank: number
  readonly vodId: string
  readonly score: number
  readonly date: string
  readonly event: string
  readonly eventTier: ProVodEventTier
  readonly playerId: string
  readonly opponentTag: string
  readonly fighterIds: readonly string[]
  readonly videoUrl: string
  readonly startSeconds?: number
  readonly reasons: readonly string[]
}

export interface ProCoverageSummary {
  readonly totalFighters: number
  readonly teachingReady: number
  readonly evidenceBuilding: number
  readonly cataloged: number
  readonly representativeSeeded: number
  readonly researchQueued: number
  readonly nextFighterIds: readonly string[]
}

const eventTierWeight: Readonly<Record<ProVodEventTier, number>> = {
  supermajor: 260,
  major: 220,
  regional: 150,
  invitational: 140,
  weekly: 80,
  unknown: 20,
}

const coverageStateWeight: Readonly<Record<ProFighterCoverage['state'], number>> = {
  'research-queued': 190,
  'representative-seeded': 180,
  cataloged: 165,
  'evidence-building': 90,
  'teaching-ready': 0,
}

const unique = (values: readonly string[]) => [...new Set(values)]

const normalizedMoveName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')

const reportFromIssues = (issues: readonly ProReviewValidationIssue[]): ProReviewValidationReport => {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  return { issues, errors, warnings, valid: errors.length === 0 }
}

const addIssue = (
  issues: ProReviewValidationIssue[],
  code: string,
  severity: ProReviewValidationSeverity,
  recordId: string,
  message: string,
) => {
  issues.push({ code, severity, recordId, message })
}

const timestampInsideKnownSet = (timestampSeconds: number, vod: ProVodRecord) => {
  if (vod.startSeconds === undefined || vod.endSeconds === undefined) return true
  const duration = vod.endSeconds - vod.startSeconds
  const validAbsolute = timestampSeconds >= vod.startSeconds && timestampSeconds <= vod.endSeconds
  const validRelative = duration >= 0 && timestampSeconds >= 0 && timestampSeconds <= duration
  return validAbsolute || validRelative
}

export function validateDecisionMoments(
  moments: readonly ProDecisionMoment[],
  vods: readonly ProVodRecord[],
  fighterIds: readonly string[],
  frameData: readonly FighterFrameData[] = [],
): ProReviewValidationReport {
  const issues: ProReviewValidationIssue[] = []
  const vodById = new Map(vods.map((vod) => [vod.id, vod]))
  const canonicalFighterIds = new Set(fighterIds)
  const frameDataByFighter = new Map(frameData.map((fighter) => [fighter.fighterId, fighter]))
  const seenIds = new Set<string>()

  for (const moment of moments) {
    if (seenIds.has(moment.id)) {
      addIssue(issues, 'duplicate-moment-id', 'error', moment.id, 'Decision moment IDs must be unique.')
    }
    seenIds.add(moment.id)

    const vod = vodById.get(moment.vodId)
    if (!vod) {
      addIssue(issues, 'unknown-vod', 'error', moment.id, `Unknown VOD ${moment.vodId}.`)
    }
    if (!Number.isInteger(moment.game) || moment.game < 1) {
      addIssue(issues, 'invalid-game', 'error', moment.id, 'Game must be a positive integer.')
    }
    if (!Number.isFinite(moment.timestampSeconds) || moment.timestampSeconds < 0) {
      addIssue(issues, 'invalid-timestamp', 'error', moment.id, 'Timestamp must be a non-negative finite number.')
    } else if (vod && !timestampInsideKnownSet(moment.timestampSeconds, vod)) {
      addIssue(
        issues,
        'timestamp-outside-set',
        'error',
        moment.id,
        'Timestamp is outside both the absolute and set-relative bounds recorded for this VOD.',
      )
    }

    if (!canonicalFighterIds.has(moment.fighterId)) {
      addIssue(issues, 'unknown-fighter', 'error', moment.id, `Unknown fighter ${moment.fighterId}.`)
    } else if (vod && !vod.playerFighterIds.includes(moment.fighterId)) {
      addIssue(
        issues,
        'fighter-not-confirmed-in-vod',
        'error',
        moment.id,
        `Fighter ${moment.fighterId} is not confirmed on the reviewed player's side of ${vod.id}.`,
      )
    }

    if (moment.opponentFighterId) {
      if (!canonicalFighterIds.has(moment.opponentFighterId)) {
        addIssue(issues, 'unknown-opponent-fighter', 'error', moment.id, `Unknown opponent fighter ${moment.opponentFighterId}.`)
      } else if (vod && !vod.opponentFighterIds.includes(moment.opponentFighterId)) {
        addIssue(
          issues,
          'opponent-not-confirmed-in-vod',
          'error',
          moment.id,
          `Opponent fighter ${moment.opponentFighterId} is not confirmed in ${vod.id}.`,
        )
      }
    }

    if (!Number.isFinite(moment.confidence) || moment.confidence < 0 || moment.confidence > 1) {
      addIssue(issues, 'invalid-confidence', 'error', moment.id, 'Confidence must be between 0 and 1.')
    }
    if (!moment.chosenOption.trim()) {
      addIssue(issues, 'empty-chosen-option', 'error', moment.id, 'Chosen option cannot be empty.')
    }
    if (!moment.observableOutcome.trim()) {
      addIssue(issues, 'empty-observable-outcome', 'error', moment.id, 'Observable outcome cannot be empty.')
    }

    const normalizedTags = moment.teachingTags.map((tag) => tag.trim().toLowerCase())
    if (normalizedTags.some((tag) => !tag)) {
      addIssue(issues, 'empty-teaching-tag', 'error', moment.id, 'Teaching tags cannot be empty.')
    }
    if (new Set(normalizedTags).size !== normalizedTags.length) {
      addIssue(issues, 'duplicate-teaching-tag', 'warning', moment.id, 'Duplicate teaching tags do not add evidence.')
    }

    for (const reference of moment.frameDataReferences ?? []) {
      if (reference.fighterId !== moment.fighterId) {
        addIssue(
          issues,
          'frame-fighter-mismatch',
          'error',
          moment.id,
          `Frame reference fighter ${reference.fighterId} does not match moment fighter ${moment.fighterId}.`,
        )
      }
      if (reference.metrics.length === 0) {
        addIssue(issues, 'empty-frame-metrics', 'error', moment.id, `Frame reference ${reference.moveName} has no requested metrics.`)
      }

      if (frameData.length > 0) {
        const fighterData = frameDataByFighter.get(reference.fighterId)
        if (!fighterData) {
          addIssue(issues, 'missing-frame-fighter', 'error', moment.id, `No committed frame-data row exists for ${reference.fighterId}.`)
          continue
        }
        const move = reference.moveId
          ? fighterData.moves.find((candidate) => candidate.id === reference.moveId)
          : fighterData.moves.find((candidate) => normalizedMoveName(candidate.name) === normalizedMoveName(reference.moveName))
        if (!move) {
          addIssue(issues, 'missing-frame-move', 'error', moment.id, `Frame-data move ${reference.moveName} could not be resolved.`)
        }
      }
    }
  }

  return reportFromIssues(issues)
}

export function validateSetBreakdowns(
  breakdowns: readonly ProSetBreakdown[],
  moments: readonly ProDecisionMoment[],
  vods: readonly ProVodRecord[],
): ProReviewValidationReport {
  const issues: ProReviewValidationIssue[] = []
  const vodIds = new Set(vods.map((vod) => vod.id))
  const momentById = new Map(moments.map((moment) => [moment.id, moment]))
  const seenVodIds = new Set<string>()

  for (const breakdown of breakdowns) {
    if (seenVodIds.has(breakdown.vodId)) {
      addIssue(issues, 'duplicate-set-breakdown', 'error', breakdown.vodId, 'Only one set breakdown may exist per VOD.')
    }
    seenVodIds.add(breakdown.vodId)

    if (!vodIds.has(breakdown.vodId)) {
      addIssue(issues, 'breakdown-unknown-vod', 'error', breakdown.vodId, 'Set breakdown references an unknown VOD.')
    }

    const decisionIds = breakdown.decisionMomentIds
    if (new Set(decisionIds).size !== decisionIds.length) {
      addIssue(issues, 'duplicate-breakdown-moment', 'error', breakdown.vodId, 'A breakdown cannot count the same decision moment twice.')
    }

    for (const momentId of decisionIds) {
      const moment = momentById.get(momentId)
      if (!moment) {
        addIssue(issues, 'missing-breakdown-moment', 'error', breakdown.vodId, `Decision moment ${momentId} does not exist.`)
      } else if (moment.vodId !== breakdown.vodId) {
        addIssue(issues, 'cross-vod-breakdown-moment', 'error', breakdown.vodId, `Decision moment ${momentId} belongs to ${moment.vodId}.`)
      } else if (!isTeachingEligibleMoment(moment)) {
        addIssue(issues, 'ineligible-breakdown-moment', 'error', breakdown.vodId, `Decision moment ${momentId} is not teaching eligible.`)
      }
    }

    for (const phase of breakdown.phaseSummaries) {
      if (!Number.isInteger(phase.startGame) || !Number.isInteger(phase.endGame) || phase.startGame < 1 || phase.endGame < phase.startGame) {
        addIssue(issues, 'invalid-phase-range', 'error', breakdown.vodId, `Phase ${phase.label} has an invalid game range.`)
      }
      for (const momentId of phase.evidenceMomentIds) {
        const moment = momentById.get(momentId)
        if (!moment || moment.vodId !== breakdown.vodId) {
          addIssue(issues, 'invalid-phase-evidence', 'error', breakdown.vodId, `Phase ${phase.label} references invalid evidence ${momentId}.`)
        } else if (moment.game < phase.startGame || moment.game > phase.endGame) {
          addIssue(issues, 'phase-evidence-outside-range', 'error', breakdown.vodId, `Evidence ${momentId} falls outside phase ${phase.label}.`)
        }
      }
    }

    if (breakdown.status === 'queued' && decisionIds.length > 0) {
      addIssue(issues, 'queued-breakdown-has-evidence', 'warning', breakdown.vodId, 'Queued breakdown already contains reviewed evidence.')
    }
    if ((breakdown.status === 'annotated' || breakdown.status === 'reviewed') && decisionIds.length === 0) {
      addIssue(issues, 'advanced-breakdown-without-evidence', 'error', breakdown.vodId, `${breakdown.status} breakdown has no reviewed evidence.`)
    }
  }

  return reportFromIssues(issues)
}

const coverageForVod = (vod: ProVodRecord, coverageByFighter: ReadonlyMap<string, ProFighterCoverage>) =>
  unique([...vod.playerFighterIds, ...vod.opponentFighterIds])
    .map((fighterId) => coverageByFighter.get(fighterId))
    .filter((entry): entry is ProFighterCoverage => entry !== undefined)

const matchupIdentity = (vod: ProVodRecord) =>
  `${[...vod.playerFighterIds].sort().join(',')}|${[...vod.opponentFighterIds].sort().join(',')}`

export function buildProReviewPlan(
  vods: readonly ProVodRecord[],
  coverage: readonly ProFighterCoverage[],
  options: ProReviewPlanOptions = {},
): readonly ProRankedVodReviewTarget[] {
  const fighterFilter = new Set(options.fighterFilter ?? [])
  const focusFighterIds = new Set(options.focusFighterIds ?? [])
  const coverageByFighter = new Map(coverage.map((entry) => [entry.fighterId, entry]))
  const matchupCounts = new Map<string, number>()

  for (const vod of vods) {
    const key = matchupIdentity(vod)
    matchupCounts.set(key, (matchupCounts.get(key) ?? 0) + 1)
  }

  const candidates = vods
    .filter((vod) => vod.analysisStatus !== 'reviewed')
    .filter((vod) => vod.linkKind !== 'source-index' && vod.quality.visibleGameplay)
    .filter((vod) => fighterFilter.size === 0 || [...vod.playerFighterIds, ...vod.opponentFighterIds].some((id) => fighterFilter.has(id)))
    .map((vod) => {
      const relevantCoverage = coverageForVod(vod, coverageByFighter)
      const fighterIds = unique([...vod.playerFighterIds, ...vod.opponentFighterIds])
      const focusHits = fighterIds.filter((fighterId) => focusFighterIds.has(fighterId))
      const lowestStateWeight = relevantCoverage.reduce((highest, entry) => Math.max(highest, coverageStateWeight[entry.state]), 0)
      const reviewDeficit = relevantCoverage.reduce((highest, entry) => Math.max(highest, Math.max(0, 4 - entry.reviewedMomentCount)), 0)
      const currentEvidenceDeficit = relevantCoverage.some((entry) => entry.currentVodCount === 0) ? 35 : 0
      const matchupScarcity = Math.max(0, 10 - (matchupCounts.get(matchupIdentity(vod)) ?? 0)) * 4
      const qualityBonus = Math.min(100, Math.max(0, vod.quality.score))
      const annotatedBonus = vod.analysisStatus === 'annotated' ? 30 : 0
      const score =
        eventTierWeight[vod.eventTier] +
        lowestStateWeight +
        reviewDeficit * 15 +
        currentEvidenceDeficit +
        matchupScarcity +
        qualityBonus +
        annotatedBonus +
        focusHits.length * 500

      const reasons: string[] = [
        `${vod.eventTier} tournament evidence`,
        `quality score ${vod.quality.score}`,
      ]
      if (lowestStateWeight >= coverageStateWeight.cataloged) reasons.push('includes an under-reviewed fighter')
      if (reviewDeficit > 0) reasons.push('fills reviewed-moment deficit')
      if (currentEvidenceDeficit > 0) reasons.push('adds current-era evidence')
      if (matchupScarcity >= 24) reasons.push('improves matchup diversity')
      if (focusHits.length > 0) reasons.push(`focus fighter: ${focusHits.join(', ')}`)
      if (vod.analysisStatus === 'annotated') reasons.push('finish an already-annotated set')

      const optionalStart = vod.startSeconds === undefined ? {} : { startSeconds: vod.startSeconds }
      return {
        rank: 0,
        vodId: vod.id,
        score,
        date: vod.date,
        event: vod.event,
        eventTier: vod.eventTier,
        playerId: vod.playerId,
        opponentTag: vod.opponentTag,
        fighterIds,
        videoUrl: vod.videoUrl,
        ...optionalStart,
        reasons,
      } satisfies ProRankedVodReviewTarget
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.date.localeCompare(a.date) ||
        a.playerId.localeCompare(b.playerId) ||
        a.vodId.localeCompare(b.vodId),
    )

  const limited = options.limit === undefined ? candidates : candidates.slice(0, Math.max(0, options.limit))
  return limited.map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}

export function summarizeProCoverage(
  coverage: readonly ProFighterCoverage[],
  nextTargetCount = 12,
): ProCoverageSummary {
  const stateCount = (state: ProFighterCoverage['state']) => coverage.filter((entry) => entry.state === state).length
  const nextFighterIds = [...coverage]
    .filter((entry) => entry.state !== 'teaching-ready')
    .sort(
      (a, b) =>
        coverageStateWeight[b.state] - coverageStateWeight[a.state] ||
        a.reviewedMomentCount - b.reviewedMomentCount ||
        a.currentVodCount - b.currentVodCount ||
        a.fighterId.localeCompare(b.fighterId),
    )
    .slice(0, Math.max(0, nextTargetCount))
    .map((entry) => entry.fighterId)

  return {
    totalFighters: coverage.length,
    teachingReady: stateCount('teaching-ready'),
    evidenceBuilding: stateCount('evidence-building'),
    cataloged: stateCount('cataloged'),
    representativeSeeded: stateCount('representative-seeded'),
    researchQueued: stateCount('research-queued'),
    nextFighterIds,
  }
}
