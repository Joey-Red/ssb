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

const contextSet = new Set<string>(reviewContexts)
const evidenceClassSet = new Set<string>(reviewEvidenceClasses)
const positions = new Set(['center', 'corner', 'ledge', 'offstage', 'platform', 'unknown'])
const frameMetrics = new Set(['startup', 'active', 'totalFrames', 'faf', 'landingLag', 'onShield'])
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const isOptionalString = (value: unknown) => value === undefined || typeof value === 'string'
const isOptionalNumber = (value: unknown) => value === undefined || typeof value === 'number'
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

const splitLines = (value: string) => value
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean)

const validImportedMoment = (value: unknown): value is ProDecisionMoment => {
  if (!isRecord(value) || !isRecord(value.state)) return false
  if (typeof value.id !== 'string' || typeof value.vodId !== 'string' || typeof value.fighterId !== 'string') return false
  if (typeof value.game !== 'number' || typeof value.timestampSeconds !== 'number' || typeof value.confidence !== 'number') return false
  if (typeof value.context !== 'string' || !contextSet.has(value.context)) return false
  if (typeof value.chosenOption !== 'string' || typeof value.observableOutcome !== 'string') return false
  if (typeof value.evidenceClass !== 'string' || !evidenceClassSet.has(value.evidenceClass)) return false
  if (!isStringArray(value.teachingTags)) return false
  if (!isOptionalString(value.opponentFighterId) || !isOptionalString(value.interpretation) || !isOptionalString(value.reviewerNote)) return false
  if (value.plausibleAlternatives !== undefined && !isStringArray(value.plausibleAlternatives)) return false

  const state = value.state
  if (!isOptionalNumber(state.playerStocks) || !isOptionalNumber(state.opponentStocks)) return false
  if (!isOptionalNumber(state.playerPercent) || !isOptionalNumber(state.opponentPercent)) return false
  if (!isOptionalString(state.stage)) return false
  if (state.position !== undefined && (typeof state.position !== 'string' || !positions.has(state.position))) return false
  if (state.resources !== undefined && !isStringArray(state.resources)) return false

  if (value.frameDataReferences !== undefined) {
    if (!Array.isArray(value.frameDataReferences)) return false
    for (const reference of value.frameDataReferences) {
      if (!isRecord(reference)) return false
      if (typeof reference.fighterId !== 'string' || typeof reference.moveName !== 'string') return false
      if (!isOptionalString(reference.moveId) || !isOptionalString(reference.note)) return false
      if (!Array.isArray(reference.metrics) || !reference.metrics.every((metric) => typeof metric === 'string' && frameMetrics.has(metric))) return false
    }
  }
  return true
}

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

  if (!isRecord(value)) return { draft: null, errors: ['Draft JSON must be an object.'] }

  if (value.version !== 1) errors.push('Unsupported review-draft version.')
  if (typeof value.vodId !== 'string' || !value.vodId.trim()) errors.push('Draft must include a VOD id.')
  if (expectedVodId && value.vodId !== expectedVodId) errors.push(`Draft belongs to ${typeof value.vodId === 'string' ? value.vodId : 'another VOD'}, not ${expectedVodId}.`)
  if (value.targetStatus !== 'annotated' && value.targetStatus !== 'reviewed') errors.push('Target status must be annotated or reviewed.')
  if (!Array.isArray(value.moments)) errors.push('Draft moments must be an array.')
  else value.moments.forEach((moment, index) => {
    if (!validImportedMoment(moment)) errors.push(`Moment ${index + 1} has an invalid or incomplete structure.`)
  })
  for (const field of ['thesis', 'recurringHabits', 'adaptationNotes', 'reviewerNotes'] as const) {
    if (typeof value[field] !== 'string') errors.push(`${field} must be a string.`)
  }

  if (errors.length > 0) return { draft: null, errors }
  return { draft: value as unknown as ProReviewWorkbenchDraft, errors: [] }
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
