import { describe, expect, it } from 'vitest'
import {
  buildProReviewPlan,
  summarizeProCoverage,
  validateDecisionMoments,
  validateSetBreakdowns,
} from './proLabPhase2'
import {
  proCoverageSummary,
  proDecisionMomentValidation,
  proRankedVodReviewPlan,
  proRosterReviewBatch,
  proRosterReviewFighterPriority,
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
  playerFighterIds: ['mario'],
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
  fighterId: 'mario',
  opponentFighterId: 'fox',
  context: 'neutral',
  state: { position: 'center' },
  chosenOption: 'short-hop aerial',
  observableOutcome: 'The opponent shields and Mario lands nearby.',
  evidenceClass: 'observed',
  confidence: 0.9,
  teachingTags: ['shield pressure'],
}

describe('Pro Lab Phase 2 review infrastructure', () => {
  it('accepts evidence records that resolve against VOD and fighter metadata', () => {
    const report = validateDecisionMoments(
      [validMoment],
      [makeVod()],
      ['mario', 'fox'],
    )
    expect(report.valid).toBe(true)
    expect(report.issues).toEqual([])
  })

  it('rejects duplicated, out-of-bounds, or metadata-inconsistent annotations', () => {
    const invalid: ProDecisionMoment = {
      ...validMoment,
      timestampSeconds: 500,
      fighterId: 'luigi',
      opponentFighterId: 'falco',
      confidence: 1.2,
      teachingTags: ['Spacing', ' spacing '],
    }
    const report = validateDecisionMoments(
      [invalid, invalid],
      [makeVod()],
      ['mario', 'fox', 'luigi', 'falco'],
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

  it('keeps the default review plan unfocused while allowing explicit caller focus', () => {
    const mario = makeVod({ id: 'mario-regional', eventTier: 'regional', date: '2026-07-01' })
    const unrelated = makeVod({
      id: 'fox-supermajor',
      eventTier: 'supermajor',
      playerFighterIds: ['fox'],
      opponentFighterIds: ['luigi'],
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
      makeCoverage('mario'),
      makeCoverage('fox'),
      makeCoverage('luigi'),
    ]

    const defaultPlan = buildProReviewPlan([mario, unrelated, unresolved], coverage)
    const focused = buildProReviewPlan([unrelated, unresolved, mario], coverage, {
      focusFighterIds: ['mario'],
    })
    const focusedAgain = buildProReviewPlan([mario, unresolved, unrelated], coverage, {
      focusFighterIds: ['mario'],
    })

    expect(defaultPlan.map((entry) => entry.vodId)).toEqual(['fox-supermajor', 'mario-regional'])
    expect(focused.map((entry) => entry.vodId)).toEqual(focusedAgain.map((entry) => entry.vodId))
    expect(focused.map((entry) => entry.vodId)).toEqual(['mario-regional', 'fox-supermajor'])
    expect(focused[0]?.reasons).toContain('focus fighter: mario')
    expect(focused.map((entry) => entry.rank)).toEqual([1, 2])
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

  it('builds a production review plan for the complete 820-VOD live corpus', () => {
    expect(proVodCatalog).toHaveLength(820)
    expect(proRankedVodReviewPlan).toHaveLength(820)
    expect(proRankedVodReviewPlan.every((target) => target.rank >= 1)).toBe(true)
    expect(new Set(proRankedVodReviewPlan.map((target) => target.vodId)).size).toBe(820)
    expect(proRankedVodReviewPlan.every((target) => target.videoUrl.startsWith('https://'))).toBe(true)
  })

  it('creates a roster-neutral production review batch from coverage priority', () => {
    expect(proRosterReviewFighterPriority).toHaveLength(89)
    expect(proRosterReviewBatch).toHaveLength(16)
    expect(proRosterReviewBatch.map((target) => target.rank)).toEqual(
      proRosterReviewBatch.map((_, index) => index + 1),
    )

    const primaryFighters = new Set<string>()
    for (const target of proRosterReviewBatch) {
      const vod = proVodCatalog.find((entry) => entry.id === target.vodId)
      expect(vod).toBeTruthy()
      vod?.playerFighterIds.forEach((fighterId) => primaryFighters.add(fighterId))
    }
    expect(primaryFighters.size).toBeGreaterThan(8)
  })

  it('keeps the production evidence model structurally valid before annotations begin', () => {
    expect(proDecisionMomentValidation.valid).toBe(true)
    expect(proSetBreakdownValidation.valid).toBe(true)
    expect(proCoverageSummary.totalFighters).toBe(89)
    expect(proCoverageSummary.teachingReady).toBe(0)
  })
})
