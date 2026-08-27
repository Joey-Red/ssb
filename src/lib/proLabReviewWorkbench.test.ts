import { describe, expect, it } from 'vitest'
import type { ProVodRecord } from '../data/proLabTypes'
import { validateProReviewSubmission } from './proLabReviewIntake'
import {
  buildProReviewSubmissionFromDraft,
  createBlankProReviewMoment,
  createProReviewWorkbenchDraft,
  parseProReviewWorkbenchDraft,
  reviewPlaybackSeconds,
  serializeProReviewWorkbenchDraft,
} from './proLabReviewWorkbench'

const vod: ProVodRecord = {
  id: 'pilot-vod',
  title: 'Pilot set',
  playerId: 'player',
  playerFighterIds: ['pyra', 'mythra'],
  opponentTag: 'Opponent',
  opponentFighterIds: ['rob'],
  event: 'Major',
  eventTier: 'major',
  date: '2026-01-01',
  round: 'Top 8',
  videoUrl: 'https://www.youtube.com/watch?v=example',
  videoProvider: 'youtube',
  linkKind: 'direct-video',
  startSeconds: 600,
  endSeconds: 900,
  gameVersion: '13.0.1',
  sourceUrls: ['https://example.com/source'],
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
}

describe('Pro Lab review workbench helpers', () => {
  it('creates an intentionally invalid evidence-empty draft', () => {
    const draft = createProReviewWorkbenchDraft(vod)
    const submission = buildProReviewSubmissionFromDraft(draft)
    const report = validateProReviewSubmission(submission, [vod], ['pyra', 'mythra', 'rob'])

    expect(draft.moments).toHaveLength(0)
    expect(report.valid).toBe(false)
    expect(report.errors.some((issue) => issue.code === 'review-submission-no-eligible-evidence')).toBe(true)
  })

  it('turns direct observations into a validator-ready submission', () => {
    const moment = {
      ...createBlankProReviewMoment(vod, 0),
      game: 2,
      timestampSeconds: 84,
      fighterId: 'pyra',
      opponentFighterId: 'rob',
      chosenOption: 'short-hop back air',
      observableOutcome: 'back air connected and pushed ROB toward the corner',
      confidence: 0.9,
      teachingTags: ['corner pressure'],
    }
    const draft = {
      ...createProReviewWorkbenchDraft(vod),
      moments: [moment],
      thesis: 'Reviewed set notes.',
      recurringHabits: 'corner pressure\nledge reset',
      reviewerNotes: 'Direct footage review completed.',
    }
    const submission = buildProReviewSubmissionFromDraft(draft)
    const report = validateProReviewSubmission(submission, [vod], ['pyra', 'mythra', 'rob'])

    expect(submission.breakdown.decisionMomentIds).toEqual([moment.id])
    expect(submission.breakdown.recurringHabits).toEqual(['corner pressure', 'ledge reset'])
    expect(report.valid).toBe(true)
  })

  it('round-trips draft JSON and refuses unsafe imports', () => {
    const draft = createProReviewWorkbenchDraft(vod)
    const raw = serializeProReviewWorkbenchDraft(draft)
    const malformedMoment = JSON.stringify({ ...draft, moments: [{ vodId: vod.id }] })
    const malformedFrameReference = JSON.stringify({
      ...draft,
      moments: [{ ...createBlankProReviewMoment(vod, 0), frameDataReferences: [{ fighterId: 'pyra', moveName: 'Back Air', metrics: 'startup' }] }],
    })

    expect(parseProReviewWorkbenchDraft(raw, vod.id).draft).toEqual(draft)
    expect(parseProReviewWorkbenchDraft(raw, 'different-vod').draft).toBeNull()
    expect(parseProReviewWorkbenchDraft('{broken', vod.id).draft).toBeNull()
    expect(parseProReviewWorkbenchDraft(malformedMoment, vod.id).draft).toBeNull()
    expect(parseProReviewWorkbenchDraft(malformedFrameReference, vod.id).draft).toBeNull()
  })

  it('opens relative timestamps at the correct video coordinate', () => {
    const vodWithoutEnd: ProVodRecord = { ...vod }
    delete vodWithoutEnd.endSeconds

    expect(reviewPlaybackSeconds(vod, 84)).toBe(684)
    expect(reviewPlaybackSeconds(vod, 720)).toBe(720)
    expect(reviewPlaybackSeconds(vodWithoutEnd, 84)).toBe(84)
  })
})
