import { describe, expect, it } from 'vitest'
import type { ProDecisionMoment, ProSetBreakdown, ProVodRecord } from '../data/proLabTypes'
import type { ProReviewSubmission } from './proLabReviewIntake'
import { compileProEvidenceRegistry } from './proLabEvidenceRegistry'

const vod = (id: string, overrides: Partial<ProVodRecord> = {}): ProVodRecord => ({
  id,
  title: `Player vs Opponent ${id}`,
  playerId: 'player',
  playerFighterIds: ['mythra'],
  opponentTag: 'Opponent',
  opponentFighterIds: ['cloud'],
  event: 'Test Major',
  eventTier: 'major',
  date: '2026-08-01',
  round: 'Top 8',
  videoUrl: `https://www.youtube.com/watch?v=${id}`,
  videoProvider: 'youtube',
  videoId: id,
  linkKind: 'direct-video',
  gameVersion: '13.0.1',
  sourceUrls: [`https://www.youtube.com/watch?v=${id}`],
  analysisStatus: 'review-queued',
  quality: {
    tournamentEnvironment: true,
    fullSet: true,
    officialOrTournamentChannel: true,
    visibleGameplay: true,
    patchKnown: true,
    score: 95,
    notes: [],
  },
  ...overrides,
})

const moment = (vodId: string, id = `${vodId}-moment-1`): ProDecisionMoment => ({
  id,
  vodId,
  game: 1,
  timestampSeconds: 42,
  fighterId: 'mythra',
  opponentFighterId: 'cloud',
  context: 'neutral',
  state: { playerStocks: 3, opponentStocks: 3, playerPercent: 12, opponentPercent: 18 },
  chosenOption: 'dash back then forward air',
  observableOutcome: 'forward air connected and started advantage',
  evidenceClass: 'observed',
  confidence: 0.92,
  teachingTags: ['whiff-punish'],
})

const breakdown = (
  vodId: string,
  momentId: string,
  status: ProSetBreakdown['status'] = 'annotated',
): ProSetBreakdown => ({
  vodId,
  status,
  thesis: 'Directly reviewed observations are recorded without asserting intent.',
  phaseSummaries: [],
  decisionMomentIds: [momentId],
  recurringHabits: [],
  adaptationNotes: [],
  reviewerNotes: ['Direct footage review completed.'],
})

const submission = (
  vodId: string,
  targetStatus: ProReviewSubmission['targetStatus'] = 'annotated',
  momentId = `${vodId}-moment-1`,
): ProReviewSubmission => ({
  vodId,
  targetStatus,
  moments: [moment(vodId, momentId)],
  breakdown: breakdown(vodId, momentId, targetStatus === 'reviewed' ? 'reviewed' : 'annotated'),
})

const fighterIds = ['mythra', 'cloud']

describe('Pro Lab production evidence registry', () => {
  it('promotes validator-clean reviewed evidence into production state', () => {
    const source = vod('vod-a')
    const compiled = compileProEvidenceRegistry([submission(source.id)], [source], fighterIds)

    expect(compiled.valid).toBe(true)
    expect(compiled.acceptedSubmissions).toHaveLength(1)
    expect(compiled.rejectedSubmissions).toHaveLength(0)
    expect(compiled.moments.map((entry) => entry.id)).toEqual(['vod-a-moment-1'])
    expect(compiled.breakdowns[0]?.status).toBe('annotated')
    expect(compiled.vods[0]?.analysisStatus).toBe('annotated')
    expect(source.analysisStatus).toBe('review-queued')
  })

  it('supports reviewed status only through a validator-clean reviewed breakdown', () => {
    const source = vod('vod-a')
    const compiled = compileProEvidenceRegistry([submission(source.id, 'reviewed')], [source], fighterIds)

    expect(compiled.valid).toBe(true)
    expect(compiled.breakdowns[0]?.status).toBe('reviewed')
    expect(compiled.vods[0]?.analysisStatus).toBe('reviewed')
  })

  it('fails invalid submissions closed without leaking moments or statuses', () => {
    const source = vod('vod-a')
    const bad = submission(source.id)
    const invalid: ProReviewSubmission = {
      ...bad,
      moments: [{ ...bad.moments[0]!, chosenOption: '', observableOutcome: '' }],
    }
    const compiled = compileProEvidenceRegistry([invalid], [source], fighterIds)

    expect(compiled.valid).toBe(false)
    expect(compiled.acceptedSubmissions).toHaveLength(0)
    expect(compiled.rejectedSubmissions).toHaveLength(1)
    expect(compiled.moments).toEqual([])
    expect(compiled.breakdowns[0]?.status).toBe('queued')
    expect(compiled.vods[0]?.analysisStatus).toBe('review-queued')
  })

  it('rejects every competing submission for the same VOD', () => {
    const source = vod('vod-a')
    const compiled = compileProEvidenceRegistry([
      submission(source.id, 'annotated', 'vod-a-moment-1'),
      submission(source.id, 'annotated', 'vod-a-moment-2'),
    ], [source], fighterIds)

    expect(compiled.valid).toBe(false)
    expect(compiled.acceptedSubmissions).toHaveLength(0)
    expect(compiled.rejectedSubmissions).toHaveLength(2)
    expect(compiled.errors.filter((entry) => entry.code === 'evidence-registry-duplicate-vod-submission')).toHaveLength(2)
    expect(compiled.vods[0]?.analysisStatus).toBe('review-queued')
  })

  it('requires globally unique moment IDs across separate VOD submissions', () => {
    const sourceA = vod('vod-a')
    const sourceB = vod('vod-b')
    const compiled = compileProEvidenceRegistry([
      submission(sourceA.id, 'annotated', 'shared-moment'),
      submission(sourceB.id, 'annotated', 'shared-moment'),
    ], [sourceA, sourceB], fighterIds)

    expect(compiled.valid).toBe(false)
    expect(compiled.acceptedSubmissions).toHaveLength(0)
    expect(compiled.rejectedSubmissions).toHaveLength(2)
    expect(compiled.errors.filter((entry) => entry.code === 'evidence-registry-duplicate-moment-id')).toHaveLength(2)
  })

  it('rejects catalog status drift when no checked-in evidence owns the state', () => {
    const source = vod('vod-a', { analysisStatus: 'annotated' })
    const compiled = compileProEvidenceRegistry([], [source], fighterIds)

    expect(compiled.valid).toBe(false)
    expect(compiled.errors.some((entry) => entry.code === 'evidence-registry-status-without-submission')).toBe(true)
    expect(compiled.moments).toEqual([])
  })
})
