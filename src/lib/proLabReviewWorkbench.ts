import type {
  DecisionContext,
  DecisionEvidenceClass,
  ProDecisionMoment,
  ProSetBreakdown,
  ProVodRecord,
} from '../data/proLabTypes'
import type { ProReviewSubmission, ProReviewSubmissionTarget } from './proLabReviewIntake'

export interface ProReviewWorkbenchDraft {
  readonly version: 1
  readonly vodId: string
  readonly targetStatus: ProReviewSubmissionTarget
  readonly moments: readonly ProDecisionMoment[]
  readonly thesis: string
  readonly recurringHabits: string
  readonly adaptationNotes: string
  readonly reviewerNotes: string
}

export interface ParsedProReviewWorkbenchDraft {
  readonly draft: ProReviewWorkbenchDraft | null
  readonly errors: readonly string[]
}

export const reviewContexts: readonly DecisionContext[] = [
  'neutral',
  'advantage',
  'disadvantage',
  'ledge',
  'recovery',
  'tech-chase',
  'shield-pressure',
  'punish',
  'kill-setup',
  'resource-management',
  'adaptation',
]

export const reviewEvidenceClasses: readonly DecisionEvidenceClass[] = [
  'observed',
  'strong-inference',
  'reasonable-inference',
  'speculative',
]

const splitLines = (value: string) => value
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean)

export function createProReviewWorkbenchDraft(vod: ProVodRecord): ProReviewWorkbenchDraft {
  return {
    version: 1,
    vodId: vod.id,
    targetStatus: 'annotated',
    moments: [],
    thesis: '',
    recurringHabits: '',
    adaptationNotes: '',
    reviewerNotes: '',
  }
}

export function createBlankProReviewMoment(
  vod: ProVodRecord,
  index: number,
): ProDecisionMoment {
  return {
    id: `${vod.id}-moment-${String(index + 1).padStart(2, '0')}`,
    vodId: vod.id,
    game: 1,
    timestampSeconds: 0,
    fighterId: vod.playerFighterIds[0] ?? '',
    opponentFighterId: vod.opponentFighterIds[0],
    context: 'neutral',
    state: {},
    chosenOption: '',
    observableOutcome: '',
    evidenceClass: 'observed',
    confidence: 0,
    teachingTags: [],
  }
}

export function buildProReviewSubmissionFromDraft(
  draft: ProReviewWorkbenchDraft,
): ProReviewSubmission {
  const breakdown: ProSetBreakdown = {
    vodId: draft.vodId,
    status: draft.targetStatus === 'reviewed' ? 'reviewed' : 'annotated',
    ...(draft.thesis.trim() ? { thesis: draft.thesis.trim() } : {}),
    phaseSummaries: [],
    decisionMomentIds: draft.moments.map((moment) => moment.id),
    recurringHabits: splitLines(draft.recurringHabits),
    adaptationNotes: splitLines(draft.adaptationNotes),
    reviewerNotes: splitLines(draft.reviewerNotes),
  }

  return {
    vodId: draft.vodId,
    targetStatus: draft.targetStatus,
    moments: draft.moments,
    breakdown,
  }
}

export function serializeProReviewWorkbenchDraft(draft: ProReviewWorkbenchDraft): string {
  return JSON.stringify(draft, null, 2)
}

export function serializeProReviewSubmission(submission: ProReviewSubmission): string {
  return JSON.stringify(submission, null, 2)
}

export function parseProReviewWorkbenchDraft(
  raw: string,
  expectedVodId?: string,
): ParsedProReviewWorkbenchDraft {
  const errors: string[] = []
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { draft: null, errors: ['Draft JSON is not valid JSON.'] }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { draft: null, errors: ['Draft JSON must be an object.'] }
  }

  const candidate = value as Partial<ProReviewWorkbenchDraft>
  if (candidate.version !== 1) errors.push('Unsupported review-draft version.')
  if (typeof candidate.vodId !== 'string' || !candidate.vodId.trim()) errors.push('Draft must include a VOD id.')
  if (expectedVodId && candidate.vodId !== expectedVodId) errors.push(`Draft belongs to ${candidate.vodId ?? 'another VOD'}, not ${expectedVodId}.`)
  if (candidate.targetStatus !== 'annotated' && candidate.targetStatus !== 'reviewed') errors.push('Target status must be annotated or reviewed.')
  if (!Array.isArray(candidate.moments)) errors.push('Draft moments must be an array.')
  for (const field of ['thesis', 'recurringHabits', 'adaptationNotes', 'reviewerNotes'] as const) {
    if (typeof candidate[field] !== 'string') errors.push(`${field} must be a string.`)
  }

  if (errors.length > 0) return { draft: null, errors }
  return { draft: candidate as ProReviewWorkbenchDraft, errors: [] }
}

/**
 * Decision timestamps may be entered as either absolute video time or relative
 * set time. Convert a relative timestamp to the actual video coordinate only
 * when both set bounds are known and the value fits inside that duration.
 */
export function reviewPlaybackSeconds(vod: ProVodRecord, timestampSeconds: number): number {
  const safeTimestamp = Math.max(0, Math.floor(timestampSeconds))
  if (vod.startSeconds === undefined || vod.endSeconds === undefined) return safeTimestamp
  const duration = Math.max(0, vod.endSeconds - vod.startSeconds)
  if (safeTimestamp <= duration) return vod.startSeconds + safeTimestamp
  return safeTimestamp
}
