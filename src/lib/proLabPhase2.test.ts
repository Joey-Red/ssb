import { describe, expect, it } from 'vitest'
import {
  buildProReviewPlan,
  summarizeProCoverage,
  validateDecisionMoments,
  validateSetBreakdowns,
} from './proLabPhase2'
import {
  proAegisPilotReviewTargets,
  proCoverageSummary,
  proDecisionMomentValidation,
  proRankedVodReviewPlan,
  proSetBreakdownValidation,
  proVodCatalog,
} from '../data/proLab'
import type {
  ProDecisionMoment,
  ProFighterCoverage,
  ProSetBreakdown,
  ProVodRecord,
} from '../data/proLabTypes'

const makeVod = (overrides: Partial<ProVodRecord> = {}): ProVodRecord => ({
  id: 'vod-a',
  title: 'Player vs Opponent',
  playerId: 'player-a',
  playerFighterIds: ['pyra', 'mythra'],
  opponentTag: 'Opponent',
  opponentFighterIds: ['fox'],
  event: 'Test Major',
  eventTier: 'major',
  date: '2026-08-01',
  round: 'Top 8',
  videoUrl: 'https://www.youtube.com/watch?v=test',
  videoProvider: 'youtube',
  videoId: 'test',
  linkKind: 'direct-video',
  startSeconds: 100,
  endSeconds: 220,
  gameVersion: '13.0.1',
  sourceUrls: ['https://example.com/source-a', 'https://example.com/source-b'],
  analysisStatus: 'review-queued',
  quality: {
    tournamentEnvironment: true,
    fullSet: true,
    officialOrTournamentChannel: true,
    visibleGameplay: true,
    patchKnown: true,
    score: 90,
    notes: [],
  },
  ...overrides,
})

const makeCoverage = (
  fighterId: string,
  overrides: Partial<ProFighterCoverage> = {},
): ProFighterCoverage => ({
  fighterId,
  state: 'cataloged',
  representativeCount: 1,
  activeRepresentativeCount: 1,
  vodCount: 1,
  currentVodCount: 1,
  reviewedMomentCount: 0,
  lessonClaimCount: 0,
  decisionExerciseCount: 0,
  matchupPatternCount: 0,
  comparisonReady: false,
  notes: [],
  ...overrides,
})

const validMoment: ProDecisionMoment = {
  id: 'moment-a',
  vodId: 'vod-a',
  game: 1,
  timestampSeconds: 15,
  fighterId: 'pyra',
  opponentFighterId: 'fox',
  context: 'neutral',
  state: { position: 'center' },
  chosenOption: 'short-hop aerial',
  observableOutcome: 'The opponent shields and Pyra lands nearby.',
  evidenceClass: 'observed',
  confidence: 0.9,
  teachingTags: ['shield pressure'],
}

describe('Pro Lab Phase 2 review infrastructure', () => {
  it('accepts evidence records that resolve against VOD and fighter metadata', () => {
    const report = validateDecisionMoments(
      [validMoment],
      [makeVod()],
      ['pyra', 'mythra', 'fox'],
    )
    expect(report.valid).toBe(true)
    expect(report.issues).toEqual([])
  })

  it('rejects duplicated, out-of-bounds, or metadata-inconsistent annotations', () => {
    const invalid: ProDecisionMoment = {
      ...validMoment,
      timestampSeconds: 500,
      fighterId: 'mario',
      opponentFighterId: 'falco',
      confidence: 1.2,
      teachingTags: ['Spacing', ' spacing '],
    }
    const report = validateDecisionMoments(
      [invalid, invalid],
      [makeVod()],
      ['pyra', 'mythra', 'fox', 'mario', 'falco'],
    )
    expect(report.valid).toBe(false)
    expect(report.errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'duplicate-moment-id',
        'timestamp-outside-set',
        'fighter-not-confirmed-in-vod',
        'opponent-not-confirmed-in-vod',
        'invalid-confidence',
      ]),
    )
    expect(report.warnings.map((issue) => issue.code)).toContain('duplicate-teaching-tag')
  })

  it('validates set breakdown evidence ownership and phase boundaries', () => {
    const validBreakdown: ProSetBreakdown = {
      vodId: 'vod-a',
      status: 'annotated',
      thesis: 'Evidence-backed test set.',
      phaseSummaries: [{
        label: 'Game 1',
        startGame: 1,
        endGame: 1,
        summary: 'One reviewed moment.',
        evidenceMomentIds: ['moment-a'],
      }],
      decisionMomentIds: ['moment-a'],
      recurringHabits: [],
      adaptationNotes: [],
    }
    expect(validateSetBreakdowns([validBreakdown], [validMoment], [makeVod()]).valid).toBe(true)

    const invalidBreakdown: ProSetBreakdown = {
      ...validBreakdown,
      phaseSummaries: [{
        ...validBreakdown.phaseSummaries[0]!,
        startGame: 2,
        endGame: 1,
      }],
      decisionMomentIds: ['missing-moment'],
    }
    const report = validateSetBreakdowns([invalidBreakdown], [validMoment], [makeVod()])
    expect(report.valid).toBe(false)
    expect(report.errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['missing-breakdown-moment', 'invalid-phase-range']),
    )
  })

  it('ranks direct footage deterministically and strongly boosts requested pilot fighters', () => {
    const aegis = makeVod({ id: 'aegis-regional', eventTier: 'regional', date: '2026-07-01' })
    const unrelated = makeVod({
      id: 'fox-supermajor',
      eventTier: 'supermajor',
      playerFighterIds: ['fox'],
      opponentFighterIds: ['mario'],
      date: '2026-08-20',
    })
    const unresolved = makeVod({
      id: 'unresolved',
      linkKind: 'source-index',
      videoProvider: 'other',
      quality: { ...makeVod().quality, visibleGameplay: false },
      analysisStatus: 'cataloged',
    })
    const coverage = [
      makeCoverage('pyra'),
      makeCoverage('mythra'),
      makeCoverage('fox'),
      makeCoverage('mario'),
    ]

    const first = buildProReviewPlan([unrelated, unresolved, aegis], coverage, {
      focusFighterIds: ['pyra', 'mythra'],
    })
    const second = buildProReviewPlan([aegis, unrelated, unresolved], coverage, {
      focusFighterIds: ['pyra', 'mythra'],
    })

    expect(first.map((entry) => entry.vodId)).toEqual(second.map((entry) => entry.vodId))
    expect(first.map((entry) => entry.vodId)).toEqual(['aegis-regional', 'fox-supermajor'])
    expect(first[0]?.reasons).toContain('focus fighter: pyra, mythra')
    expect(first.map((entry) => entry.rank)).toEqual([1, 2])
  })

  it('summarizes coverage and chooses deterministic next fighter gaps', () => {
    const summary = summarizeProCoverage([
      makeCoverage('ready', { state: 'teaching-ready', reviewedMomentCount: 5 }),
      makeCoverage('building', { state: 'evidence-building', reviewedMomentCount: 1 }),
      makeCoverage('cataloged'),
      makeCoverage('seeded', { state: 'representative-seeded', vodCount: 0, currentVodCount: 0 }),
      makeCoverage('queued', { state: 'research-queued', representativeCount: 0, activeRepresentativeCount: 0, vodCount: 0, currentVodCount: 0 }),
    ], 3)

    expect(summary).toMatchObject({
      totalFighters: 5,
      teachingReady: 1,
      evidenceBuilding: 1,
      cataloged: 1,
      representativeSeeded: 1,
      researchQueued: 1,
    })
    expect(summary.nextFighterIds).toEqual(['queued', 'seeded', 'cataloged'])
  })

  it('builds a production review plan for the fully resolved 800-VOD catalog', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(proRankedVodReviewPlan).toHaveLength(800)
    expect(proRankedVodReviewPlan.every((target) => target.rank >= 1)).toBe(true)
    expect(new Set(proRankedVodReviewPlan.map((target) => target.vodId)).size).toBe(800)
    expect(proRankedVodReviewPlan.every((target) => target.videoUrl.startsWith('https://'))).toBe(true)
  })

  it('creates an Aegis pilot queue without inventing tactical review completion', () => {
    expect(proAegisPilotReviewTargets.length).toBeGreaterThan(0)
    expect(proAegisPilotReviewTargets.length).toBeLessThanOrEqual(12)
    expect(proAegisPilotReviewTargets.every((target) =>
      target.fighterIds.includes('pyra') || target.fighterIds.includes('mythra'),
    )).toBe(true)
    expect(proAegisPilotReviewTargets.map((target) => target.rank)).toEqual(
      proAegisPilotReviewTargets.map((_, index) => index + 1),
    )
  })

  it('keeps the production evidence model structurally valid before annotations begin', () => {
    expect(proDecisionMomentValidation.valid).toBe(true)
    expect(proSetBreakdownValidation.valid).toBe(true)
    expect(proCoverageSummary.totalFighters).toBe(89)
    expect(proCoverageSummary.teachingReady).toBe(0)
  })
})
