import { describe, expect, it } from 'vitest'
import type { ProDecisionMoment, ProSetBreakdown, ProVodRecord } from '../data/proLabTypes'
import { buildProReviewSubmissionTemplate, validateProReviewSubmission } from './proLabReviewIntake'

const vod = (overrides: Partial<ProVodRecord> = {}): ProVodRecord => ({
  id: 'vod-1',
  title: 'Player vs Opponent',
  playerId: 'player',
  playerFighterIds: ['pyra', 'mythra'],
  opponentTag: 'Opponent',
  opponentFighterIds: ['cloud'],
  event: 'Test Major',
  eventTier: 'major',
  date: '2026-08-01',
  round: 'Top 8',
  videoUrl: 'https://www.youtube.com/watch?v=test',
  videoProvider: 'youtube',
  linkKind: 'direct-video',
  gameVersion: '13.0.1',
  sourceUrls: ['https://www.youtube.com/watch?v=test'],
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

const moment: ProDecisionMoment = {
  id: 'moment-1',
  vodId: 'vod-1',
  game: 1,
  timestampSeconds: 42,
  fighterId: 'mythra',
  opponentFighterId: 'cloud',
  context: 'neutral',
  state: { playerStocks: 3, opponentStocks: 3, playerPercent: 12, opponentPercent: 18 },
  chosenOption: 'dash back then forward air',
  observableOutcome: 'forward air connects and starts advantage',
  evidenceClass: 'observed',
  confidence: 0.92,
  teachingTags: ['whiff-punish'],
}

const breakdown = (status: ProSetBreakdown['status']): ProSetBreakdown => ({
  vodId: 'vod-1',
  status,
  thesis: 'Observed neutral interactions are cataloged without asserting intent.',
  phaseSummaries: [],
  decisionMomentIds: ['moment-1'],
  recurringHabits: [],
  adaptationNotes: [],
})

describe('Pro Lab review intake', () => {
  it('builds an empty metadata-only template that cannot pass as reviewed evidence', () => {
    const template = buildProReviewSubmissionTemplate(vod())
    const report = validateProReviewSubmission(template, [vod()], ['pyra', 'mythra', 'cloud'])

    expect(template.moments).toEqual([])
    expect(template.breakdown.status).toBe('queued')
    expect(report.valid).toBe(false)
    expect(report.errors.some((issue) => issue.code === 'review-submission-no-eligible-evidence')).toBe(true)
  })

  it('accepts an evidence-backed annotation submission', () => {
    const report = validateProReviewSubmission({
      vodId: 'vod-1',
      targetStatus: 'annotated',
      moments: [moment],
      breakdown: breakdown('annotated'),
    }, [vod()], ['pyra', 'mythra', 'cloud'])

    expect(report.valid).toBe(true)
    expect(report.eligibleMomentIds).toEqual(['moment-1'])
  })

  it('requires a reviewed breakdown before reviewed status', () => {
    const report = validateProReviewSubmission({
      vodId: 'vod-1',
      targetStatus: 'reviewed',
      moments: [moment],
      breakdown: breakdown('annotated'),
    }, [vod()], ['pyra', 'mythra', 'cloud'])

    expect(report.valid).toBe(false)
    expect(report.errors.some((issue) => issue.code === 'review-submission-review-target-without-reviewed-breakdown')).toBe(true)
  })

  it('rejects tactical review when the catalog only has a source index', () => {
    const sourceOnly = vod({ linkKind: 'source-index', analysisStatus: 'cataloged', quality: { ...vod().quality, visibleGameplay: false } })
    const report = validateProReviewSubmission({
      vodId: 'vod-1',
      targetStatus: 'annotated',
      moments: [moment],
      breakdown: breakdown('annotated'),
    }, [sourceOnly], ['pyra', 'mythra', 'cloud'])

    expect(report.valid).toBe(false)
    expect(report.errors.some((issue) => issue.code === 'review-submission-without-visible-gameplay')).toBe(true)
  })
})
