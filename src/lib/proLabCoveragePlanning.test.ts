import { describe, expect, it } from 'vitest'
import type { ProDecisionMoment, ProFighterCoverage } from '../data/proLabTypes'
import { buildProCoverageWorkQueue } from './proLabCoveragePlanning'

const coverage = (
  fighterId: string,
  overrides: Partial<ProFighterCoverage> = {},
): ProFighterCoverage => ({
  fighterId,
  state: 'cataloged',
  representativeCount: 1,
  activeRepresentativeCount: 1,
  vodCount: 5,
  currentVodCount: 1,
  reviewedMomentCount: 0,
  lessonClaimCount: 0,
  decisionExerciseCount: 0,
  matchupPatternCount: 0,
  comparisonReady: false,
  notes: [],
  ...overrides,
})

const moment = (id: string, vodId: string, fighterId: string): ProDecisionMoment => ({
  id,
  vodId,
  game: 1,
  timestampSeconds: 10,
  fighterId,
  context: 'neutral',
  state: {},
  chosenOption: 'dash back',
  observableOutcome: 'reset neutral',
  evidenceClass: 'observed',
  confidence: 0.9,
  teachingTags: ['spacing'],
})

describe('buildProCoverageWorkQueue', () => {
  it('follows VOD-first acquisition and leaves a genuinely complete fixture in maintenance', () => {
    const betaEvidence = Array.from({ length: 16 }, (_, index) =>
      moment(`beta-${index + 1}`, `beta-vod-${(index % 8) + 1}`, 'beta'),
    )
    const queue = buildProCoverageWorkQueue([
      coverage('alpha', { representativeCount: 0, vodCount: 0, currentVodCount: 0, state: 'research-queued' }),
      coverage('beta', { representativeCount: 2, vodCount: 12, currentVodCount: 4, reviewedMomentCount: 16, lessonClaimCount: 3, decisionExerciseCount: 6, matchupPatternCount: 2, comparisonReady: true, state: 'teaching-ready' }),
    ], betaEvidence)

    expect(queue[0]?.fighterId).toBe('alpha')
    expect(queue[0]?.nextAction).toBe('acquire-vods')
    expect(queue[1]?.reviewedSetCount).toBe(8)
    expect(queue[1]?.nextAction).toBe('maintain')
  })

  it('counts reviewed sets from teaching-eligible evidence only', () => {
    const speculative: ProDecisionMoment = { ...moment('m3', 'v3', 'aegis'), evidenceClass: 'speculative', confidence: 0.2 }
    const queue = buildProCoverageWorkQueue([
      coverage('aegis', { representativeCount: 2, vodCount: 12, currentVodCount: 4, reviewedMomentCount: 2 }),
    ], [moment('m1', 'v1', 'aegis'), moment('m2', 'v2', 'aegis'), speculative])

    expect(queue[0]?.reviewedSetCount).toBe(2)
    expect(queue[0]?.reviewedSetGap).toBe(6)
    expect(queue[0]?.nextAction).toBe('review-vods')
  })
})
