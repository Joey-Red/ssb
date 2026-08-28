import { describe, expect, it } from 'vitest'
import {
  proDecisionMoments,
  proRosterReviewBatch,
  proRosterReviewBatchStats,
  proRosterReviewWorksheets,
  proVodCatalog,
} from '../data/proLab'
import type {
  ProDecisionMoment,
  ProSetBreakdown,
  ProVodRecord,
} from '../data/proLabTypes'
import type { ProRankedVodReviewTarget } from './proLabPhase2'
import {
  buildAnnotationWorksheet,
  buildPrimaryFighterReviewBatch,
  summarizeFighterEvidenceProgress,
  validateVodAnalysisTransition,
} from './proLabAutomation'

const makeVod = (
  id: string,
  playerId: string,
  playerFighterIds: readonly string[],
  opponentTag: string,
  opponentFighterIds: readonly string[],
  analysisStatus: ProVodRecord['analysisStatus'] = 'review-queued',
): ProVodRecord => ({
  id,
  title: `${playerId} vs ${opponentTag}`,
  playerId,
  playerFighterIds,
  opponentTag,
  opponentFighterIds,
  event: 'Test Major',
  eventTier: 'major',
  date: '2026-08-01',
  round: 'Top 8',
  videoUrl: `https://www.youtube.com/watch?v=${id}`,
  videoProvider: 'youtube',
  videoId: id,
  linkKind: 'direct-video',
  gameVersion: '13.0.1',
  sourceUrls: [`https://www.youtube.com/watch?v=${id}`, 'https://example.com/bracket'],
  analysisStatus,
  quality: {
    tournamentEnvironment: true,
    fullSet: true,
    officialOrTournamentChannel: true,
    visibleGameplay: true,
    patchKnown: true,
    score: 90,
    notes: [],
  },
})

const makeTarget = (vod: ProVodRecord, rank: number, score = 800): ProRankedVodReviewTarget => ({
  rank,
  vodId: vod.id,
  score,
  date: vod.date,
  event: vod.event,
  eventTier: vod.eventTier,
  playerId: vod.playerId,
  opponentTag: vod.opponentTag,
  fighterIds: [...vod.playerFighterIds, ...vod.opponentFighterIds],
  videoUrl: vod.videoUrl,
  reasons: ['test target'],
})

const makeMoment = (
  id: string,
  vod: ProVodRecord,
  fighterId: string,
  opponentFighterId: string,
  context: ProDecisionMoment['context'] = 'neutral',
): ProDecisionMoment => ({
  id,
  vodId: vod.id,
  game: 1,
  timestampSeconds: 30,
  fighterId,
  opponentFighterId,
  context,
  state: { position: 'center' },
  chosenOption: 'dash back',
  observableOutcome: 'The opposing attack misses.',
  evidenceClass: 'observed',
  confidence: 0.9,
  teachingTags: [`${context} sample`],
})

describe('Pro Lab review automation', () => {
  it('keeps focused review targets on the cataloged player side', () => {
    const primary = makeVod('primary', 'player-a', ['mario'], 'Opponent', ['fox'])
    const opponentOnly = makeVod('opponent-only', 'player-b', ['fox'], 'Opponent', ['mario'])
    const batch = buildPrimaryFighterReviewBatch(
      [makeTarget(opponentOnly, 1, 900), makeTarget(primary, 2, 800)],
      [primary, opponentOnly],
      ['mario'],
      8,
    )
    expect(batch.map((target) => target.vodId)).toEqual(['primary'])
  })

  it('selects a deterministic diverse primary-side focused batch', () => {
    const a = makeVod('a', 'player-a', ['mario'], 'Opponent A', ['fox'])
    const b = makeVod('b', 'player-a', ['mario'], 'Opponent B', ['sonic'])
    const c = makeVod('c', 'player-b', ['mario'], 'Opponent C', ['hero'])
    const vods = [a, b, c]
    const targets = [makeTarget(a, 1, 900), makeTarget(b, 2, 895), makeTarget(c, 3, 880)]
    const first = buildPrimaryFighterReviewBatch(targets, vods, ['mario'], 2)
    const second = buildPrimaryFighterReviewBatch([...targets].reverse(), [...vods].reverse(), ['mario'], 2)
    expect(first.map((target) => target.vodId)).toEqual(second.map((target) => target.vodId))
    expect(first.map((target) => target.rank)).toEqual([1, 2])
    expect(new Set(first.map((target) => target.playerId)).size).toBe(2)
  })

  it('builds metadata-only worksheets without invented gameplay fields', () => {
    const vod = makeVod('worksheet', 'player-a', ['mario'], 'Opponent', ['fox'])
    const worksheet = buildAnnotationWorksheet(vod)
    expect(worksheet).toMatchObject({
      vodId: 'worksheet',
      playerId: 'player-a',
      opponentTag: 'Opponent',
      status: 'gameplay-observations-pending',
    })
    expect(worksheet.checklist.length).toBeGreaterThanOrEqual(5)
    expect('chosenOption' in worksheet).toBe(false)
    expect('observableOutcome' in worksheet).toBe(false)
    expect('timestampSeconds' in worksheet).toBe(false)
  })

  it('blocks status promotion until each evidence gate is satisfied', () => {
    const queued = makeVod('queued', 'player-a', ['mario'], 'Opponent', ['fox'])
    expect(validateVodAnalysisTransition(queued, 'annotated', []).valid).toBe(false)
    expect(validateVodAnalysisTransition(queued, 'annotated', []).errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['analysis-without-eligible-evidence']),
    )

    const annotated = makeVod('annotated', 'player-a', ['mario'], 'Opponent', ['fox'], 'annotated')
    const moment = makeMoment('moment-reviewed', annotated, 'mario', 'fox')
    const reviewedBreakdown: ProSetBreakdown = {
      vodId: annotated.id,
      status: 'reviewed',
      phaseSummaries: [{
        label: 'Game 1',
        startGame: 1,
        endGame: 1,
        summary: 'Reviewed evidence exists.',
        evidenceMomentIds: [moment.id],
      }],
      decisionMomentIds: [moment.id],
      recurringHabits: [],
      adaptationNotes: [],
    }
    expect(validateVodAnalysisTransition(annotated, 'reviewed', [moment], reviewedBreakdown).valid).toBe(true)
  })

  it('never advances a source-index record into gameplay review', () => {
    const unresolved: ProVodRecord = {
      ...makeVod('source-index', 'player-a', ['mario'], 'Opponent', ['fox'], 'cataloged'),
      videoUrl: 'https://example.com/index',
      videoProvider: 'other',
      linkKind: 'source-index',
      quality: { ...makeVod('quality', 'player-a', ['mario'], 'Opponent', ['fox']).quality, visibleGameplay: false },
    }
    const report = validateVodAnalysisTransition(unresolved, 'review-queued', [])
    expect(report.valid).toBe(false)
    expect(report.errors.map((issue) => issue.code)).toContain('unreviewable-footage')
  })

  it('treats sampling coverage as a review heuristic, not teaching readiness', () => {
    const opponents = ['fox', 'sonic', 'rob', 'peach']
    const vods = Array.from({ length: 8 }, (_, index) =>
      makeVod(
        `set-${index}`,
        index < 4 ? 'player-a' : 'player-b',
        ['mario'],
        `Opponent ${index}`,
        [opponents[index % opponents.length]!],
      ),
    )
    const contexts: ProDecisionMoment['context'][] = ['neutral', 'advantage', 'ledge']
    const moments = vods.map((vod, index) =>
      makeMoment(`moment-${index}`, vod, 'mario', vod.opponentFighterIds[0]!, contexts[index % contexts.length]!),
    )
    const progress = summarizeFighterEvidenceProgress(['mario'], vods, moments, 8)
    expect(progress).toMatchObject({
      reviewedSetCount: 8,
      representativePlayerCount: 2,
      opponentFighterCount: 4,
      contextCount: 3,
      status: 'sampling-target-met',
    })
  })

  it('ships a roster-neutral review pack while leaving tactical evidence evidence-gated', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(proRosterReviewBatch).toHaveLength(16)
    expect(proRosterReviewWorksheets).toHaveLength(proRosterReviewBatch.length)

    const primaryFighters = new Set<string>()
    for (const target of proRosterReviewBatch) {
      const vod = proVodCatalog.find((entry) => entry.id === target.vodId)
      expect(vod).toBeTruthy()
      vod?.playerFighterIds.forEach((fighterId) => primaryFighters.add(fighterId))
    }

    expect(primaryFighters.size).toBe(proRosterReviewBatchStats.primaryFighterCount)
    expect(primaryFighters.size).toBeGreaterThan(8)
    expect(proRosterReviewBatchStats.targetCount).toBe(16)
    expect(proDecisionMoments).toHaveLength(0)
  })
})
