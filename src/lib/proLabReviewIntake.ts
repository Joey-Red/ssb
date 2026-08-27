import type {
  ProDecisionMoment,
  ProSetBreakdown,
  ProVodAnalysisStatus,
  ProVodRecord,
} from '../data/proLabTypes'
import { isTeachingEligibleMoment } from './proLab'
import { validateVodAnalysisTransition } from './proLabAutomation'
import {
  validateDecisionMoments,
  validateSetBreakdowns,
  type ProReviewValidationIssue,
  type ProReviewValidationReport,
} from './proLabPhase2'

export type ProReviewSubmissionTarget = Extract<ProVodAnalysisStatus, 'annotated' | 'reviewed'>

export interface ProReviewSubmission {
  readonly vodId: string
  readonly targetStatus: ProReviewSubmissionTarget
  readonly moments: readonly ProDecisionMoment[]
  readonly breakdown: ProSetBreakdown
}

export interface ProReviewSubmissionReport extends ProReviewValidationReport {
  readonly eligibleMomentCount: number
  readonly eligibleMomentIds: readonly string[]
}

const reportFromIssues = (
  issues: readonly ProReviewValidationIssue[],
  eligibleMomentIds: readonly string[],
): ProReviewSubmissionReport => {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  return {
    issues,
    errors,
    warnings,
    valid: errors.length === 0,
    eligibleMomentCount: eligibleMomentIds.length,
    eligibleMomentIds,
  }
}

const statusPath = (
  current: ProVodAnalysisStatus,
  target: ProReviewSubmissionTarget,
): readonly ProVodAnalysisStatus[] => {
  const order: readonly ProVodAnalysisStatus[] = ['cataloged', 'review-queued', 'annotated', 'reviewed']
  const currentIndex = order.indexOf(current)
  const targetIndex = order.indexOf(target)
  if (currentIndex < 0 || targetIndex < currentIndex) return []
  return order.slice(currentIndex + 1, targetIndex + 1)
}

export function buildProReviewSubmissionTemplate(vod: ProVodRecord): ProReviewSubmission {
  return {
    vodId: vod.id,
    targetStatus: 'annotated',
    moments: [],
    breakdown: {
      vodId: vod.id,
      status: 'queued',
      phaseSummaries: [],
      decisionMomentIds: [],
      recurringHabits: [],
      adaptationNotes: [],
      reviewerNotes: [
        'Template only. Replace this note with source-backed observations after direct gameplay review.',
      ],
    },
  }
}

/**
 * Validates one human review submission before it is allowed into production
 * evidence data. This function never invents decisions from VOD metadata; it
 * only checks explicit submitted observations against the catalog and the
 * existing evidence gates.
 */
export function validateProReviewSubmission(
  submission: ProReviewSubmission,
  vods: readonly ProVodRecord[],
  fighterIds: readonly string[],
): ProReviewSubmissionReport {
  const issues: ProReviewValidationIssue[] = []
  const vod = vods.find((entry) => entry.id === submission.vodId)
  const add = (code: string, severity: ProReviewValidationIssue['severity'], recordId: string, message: string) => {
    issues.push({ code, severity, recordId, message })
  }

  if (!vod) {
    add('review-submission-unknown-vod', 'error', submission.vodId, 'Review submission references an unknown VOD.')
  }
  if (submission.breakdown.vodId !== submission.vodId) {
    add('review-submission-breakdown-vod-mismatch', 'error', submission.vodId, 'Breakdown VOD must match the review submission VOD.')
  }

  const crossVodMoments = submission.moments.filter((moment) => moment.vodId !== submission.vodId)
  for (const moment of crossVodMoments) {
    add('review-submission-cross-vod-moment', 'error', moment.id, `Moment belongs to ${moment.vodId}, not ${submission.vodId}.`)
  }

  if (vod && (vod.linkKind === 'source-index' || !vod.quality.visibleGameplay)) {
    add('review-submission-without-visible-gameplay', 'error', submission.vodId, 'Direct visible gameplay is required before tactical observations can be accepted.')
  }

  const momentValidation = validateDecisionMoments(submission.moments, vods, fighterIds)
  issues.push(...momentValidation.issues)

  const breakdownValidation = validateSetBreakdowns([submission.breakdown], submission.moments, vods)
  issues.push(...breakdownValidation.issues)

  const eligibleMomentIds = submission.moments
    .filter(isTeachingEligibleMoment)
    .map((moment) => moment.id)

  if (eligibleMomentIds.length === 0) {
    add('review-submission-no-eligible-evidence', 'error', submission.vodId, 'At least one teaching-eligible reviewed moment is required for annotation.')
  }
  if (submission.breakdown.status === 'queued') {
    add('review-submission-breakdown-still-queued', 'error', submission.vodId, 'An annotation submission requires an annotated or reviewed set breakdown.')
  }
  if (submission.targetStatus === 'reviewed' && submission.breakdown.status !== 'reviewed') {
    add('review-submission-review-target-without-reviewed-breakdown', 'error', submission.vodId, 'Reviewed target status requires a reviewed set breakdown.')
  }

  const referencedMomentIds = new Set(submission.breakdown.decisionMomentIds)
  for (const momentId of eligibleMomentIds) {
    if (!referencedMomentIds.has(momentId)) {
      add('review-submission-unreferenced-moment', 'warning', momentId, 'Eligible reviewed moment is not referenced by the set breakdown.')
    }
  }

  if (vod) {
    let simulatedVod = vod
    for (const nextStatus of statusPath(vod.analysisStatus, submission.targetStatus)) {
      const transition = validateVodAnalysisTransition(
        simulatedVod,
        nextStatus,
        submission.moments,
        submission.breakdown,
      )
      issues.push(...transition.issues)
      simulatedVod = { ...simulatedVod, analysisStatus: nextStatus }
    }
    if (vod.analysisStatus === 'reviewed' && submission.targetStatus !== 'reviewed') {
      add('review-submission-status-regression', 'error', submission.vodId, 'Reviewed production evidence cannot be submitted back to annotated status.')
    }
  }

  return reportFromIssues(issues, eligibleMomentIds)
}
