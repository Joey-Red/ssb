import { describe, expect, it } from 'vitest'
import type { ProDecisionMoment, ProFighterCoverage } from '../data/proLabTypes'
import { buildProCoverageDistributionAudit, buildProCoverageWorkQueue } from './proLabCoveragePlanning'

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
    expect(queue[0]?.vodCount).toBe(0)
    expect(queue[1]?.reviewedSetCount).toBe(8)
    expect(queue[1]?.reviewedMomentCount).toBe(16)
    expect(queue[1]?.nextAction).toBe('maintain')
  })

  it('keeps a current-era evidence deficit in the VOD acquisition phase', () => {
    const evidence = Array.from({ length: 16 }, (_, index) =>
      moment(`current-${index + 1}`, `current-vod-${(index % 8) + 1}`, 'current-gap'),
    )
    const queue = buildProCoverageWorkQueue([
      coverage('current-gap', {
        representativeCount: 2,
        vodCount: 12,
        currentVodCount: 2,
        reviewedMomentCount: 16,
        lessonClaimCount: 3,
        decisionExerciseCount: 6,
        matchupPatternCount: 2,
        comparisonReady: true,
        state: 'evidence-building',
      }),
    ], evidence)

    expect(queue[0]?.vodGap).toBe(0)
    expect(queue[0]?.currentVodGap).toBe(2)
    expect(queue[0]?.currentVodCount).toBe(2)
    expect(queue[0]?.nextAction).toBe('acquire-vods')
  })

  it('counts reviewed sets from teaching-eligible evidence only', () => {
    const speculative: ProDecisionMoment = { ...moment('m3', 'v3', 'gamma'), evidenceClass: 'speculative', confidence: 0.2 }
    const queue = buildProCoverageWorkQueue([
      coverage('gamma', { representativeCount: 2, vodCount: 12, currentVodCount: 4, reviewedMomentCount: 2 }),
    ], [moment('m1', 'v1', 'gamma'), moment('m2', 'v2', 'gamma'), speculative])

    expect(queue[0]?.reviewedSetCount).toBe(2)
    expect(queue[0]?.reviewedSetGap).toBe(6)
    expect(queue[0]?.nextAction).toBe('review-vods')
  })
})

describe('buildProCoverageDistributionAudit', () => {
  it('summarizes uneven roster coverage without changing the objective work-queue order', () => {
    const betaEvidence = Array.from({ length: 16 }, (_, index) =>
      moment(`beta-audit-${index + 1}`, `beta-audit-vod-${(index % 8) + 1}`, 'beta'),
    )
    const queue = buildProCoverageWorkQueue([
      coverage('alpha', { representativeCount: 0, vodCount: 1, currentVodCount: 0, state: 'cataloged' }),
      coverage('beta', { representativeCount: 2, vodCount: 12, currentVodCount: 4, reviewedMomentCount: 16, lessonClaimCount: 3, decisionExerciseCount: 6, matchupPatternCount: 2, comparisonReady: true, state: 'teaching-ready' }),
      coverage('gamma', { representativeCount: 1, vodCount: 6, currentVodCount: 2 }),
    ], betaEvidence)
    const audit = buildProCoverageDistributionAudit(queue)

    expect(queue.map((item) => item.fighterId)).toEqual(['alpha', 'gamma', 'beta'])
    expect(audit.fighterCount).toBe(3)
    expect(audit.zeroVodFighterCount).toBe(0)
    expect(audit.totalPrimaryVodAppearances).toBe(19)
    expect(audit.totalCurrentVodAppearances).toBe(6)
    expect(audit.vodFloorMetCount).toBe(1)
    expect(audit.currentVodFloorMetCount).toBe(1)
    expect(audit.representativeFloorMetCount).toBe(1)
    expect(audit.reviewedSetFloorMetCount).toBe(1)
    expect(audit.reviewedMomentFloorMetCount).toBe(1)
    expect(audit.severeVodDeficitCount).toBe(1)
    expect(audit.totalVodGap).toBe(17)
    expect(audit.totalCurrentVodGap).toBe(6)
    expect(audit.totalRepresentativeGap).toBe(3)
    expect(audit.minimumVodCount).toBe(1)
    expect(audit.medianVodCount).toBe(6)
    expect(audit.maximumVodCount).toBe(12)
    expect(audit.nextActionCounts['acquire-vods']).toBe(2)
    expect(audit.nextActionCounts.maintain).toBe(1)
  })

  it('returns stable zero values for an empty audit', () => {
    const audit = buildProCoverageDistributionAudit([])
    expect(audit.fighterCount).toBe(0)
    expect(audit.minimumVodCount).toBe(0)
    expect(audit.medianVodCount).toBe(0)
    expect(audit.maximumVodCount).toBe(0)
  })
})
