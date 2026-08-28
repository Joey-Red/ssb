import type { ProDecisionMoment, ProSetBreakdown, ProVodRecord } from '../data/proLabTypes'
import { buildSetBreakdown } from './proLab'
import {
  validateProReviewSubmission,
  type ProReviewSubmission,
  type ProReviewSubmissionReport,
} from './proLabReviewIntake'
import type { ProReviewValidationIssue } from './proLabPhase2'

export interface ProEvidenceRegistryRejection {
  readonly submissionIndex: number
  readonly vodId: string
  readonly report: ProReviewSubmissionReport
}

export interface ProCompiledEvidenceRegistry {
  readonly sourceSubmissionCount: number
  readonly acceptedSubmissions: readonly ProReviewSubmission[]
  readonly rejectedSubmissions: readonly ProEvidenceRegistryRejection[]
  readonly moments: readonly ProDecisionMoment[]
  readonly breakdowns: readonly ProSetBreakdown[]
  readonly vods: readonly ProVodRecord[]
  readonly issues: readonly ProReviewValidationIssue[]
  readonly errors: readonly ProReviewValidationIssue[]
  readonly warnings: readonly ProReviewValidationIssue[]
  readonly valid: boolean
}

const issue = (
  code: string,
  severity: ProReviewValidationIssue['severity'],
  recordId: string,
  message: string,
): ProReviewValidationIssue => ({ code, severity, recordId, message })

const countStrings = (values: readonly string[]) => {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

const mergeReport = (
  base: ProReviewSubmissionReport,
  extraIssues: readonly ProReviewValidationIssue[],
): ProReviewSubmissionReport => {
  const issues = [...base.issues, ...extraIssues]
  const errors = issues.filter((entry) => entry.severity === 'error')
  const warnings = issues.filter((entry) => entry.severity === 'warning')
  return {
    issues,
    errors,
    warnings,
    valid: errors.length === 0,
    eligibleMomentCount: base.eligibleMomentCount,
    eligibleMomentIds: base.eligibleMomentIds,
  }
}

/**
 * Compiles checked-in direct-footage review submissions into the production
 * evidence model. Invalid submissions fail closed: none of their moments,
 * breakdowns, or status transitions are promoted into user-facing data.
 */
export function compileProEvidenceRegistry(
  submissions: readonly ProReviewSubmission[],
  sourceVods: readonly ProVodRecord[],
  fighterIds: readonly string[],
): ProCompiledEvidenceRegistry {
  const submissionVodCounts = countStrings(submissions.map((submission) => submission.vodId))
  const momentIdCounts = countStrings(submissions.flatMap((submission) => submission.moments.map((moment) => moment.id)))
  const acceptedSubmissions: ProReviewSubmission[] = []
  const rejectedSubmissions: ProEvidenceRegistryRejection[] = []
  const submissionIssues: ProReviewValidationIssue[] = []

  submissions.forEach((submission, submissionIndex) => {
    const registryIssues: ProReviewValidationIssue[] = []
    if ((submissionVodCounts.get(submission.vodId) ?? 0) > 1) {
      registryIssues.push(issue(
        'evidence-registry-duplicate-vod-submission',
        'error',
        submission.vodId,
        'Only one production review submission may own a VOD.',
      ))
    }

    for (const moment of submission.moments) {
      if ((momentIdCounts.get(moment.id) ?? 0) > 1) {
        registryIssues.push(issue(
          'evidence-registry-duplicate-moment-id',
          'error',
          moment.id,
          'Reviewed moment IDs must be globally unique across production submissions.',
        ))
      }
    }

    const report = mergeReport(
      validateProReviewSubmission(submission, sourceVods, fighterIds),
      registryIssues,
    )
    submissionIssues.push(...report.issues)

    if (report.valid) acceptedSubmissions.push(submission)
    else rejectedSubmissions.push({ submissionIndex, vodId: submission.vodId, report })
  })

  const acceptedByVod = new Map(acceptedSubmissions.map((submission) => [submission.vodId, submission]))
  const registryIssues: ProReviewValidationIssue[] = []
  for (const vod of sourceVods) {
    if ((vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed') && !acceptedByVod.has(vod.id)) {
      registryIssues.push(issue(
        'evidence-registry-status-without-submission',
        'error',
        vod.id,
        `Source catalog status ${vod.analysisStatus} requires a validator-clean checked-in review submission.`,
      ))
    }
  }

  const moments = acceptedSubmissions.flatMap((submission) => submission.moments)
  const breakdownByVod = new Map(acceptedSubmissions.map((submission) => [submission.vodId, submission.breakdown]))
  const breakdowns = sourceVods.map((vod) =>
    breakdownByVod.get(vod.id) ?? buildSetBreakdown(vod.id, moments),
  )
  const vods = sourceVods.map((vod) => {
    const submission = acceptedByVod.get(vod.id)
    return submission ? { ...vod, analysisStatus: submission.targetStatus } : vod
  })

  const issues = [...submissionIssues, ...registryIssues]
  const errors = issues.filter((entry) => entry.severity === 'error')
  const warnings = issues.filter((entry) => entry.severity === 'warning')

  return {
    sourceSubmissionCount: submissions.length,
    acceptedSubmissions,
    rejectedSubmissions,
    moments,
    breakdowns,
    vods,
    issues,
    errors,
    warnings,
    valid: errors.length === 0,
  }
}
