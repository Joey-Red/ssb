import { describe, expect, it } from 'vitest'
import {
  proAegisPilotProgress,
  proAegisPilotReviewBatch,
  proAegisPilotWorksheets,
  proDecisionMoments,
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

describe('Pro Lab pilot automation', () => {
  it('keeps pilot review targets on the cataloged player side', () => {
    const primary = makeVod('primary', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'])
    const opponentOnly = makeVod('opponent-only', 'light', ['fox'], 'Shuton', ['pyra', 'mythra'])
    const batch = buildPrimaryFighterReviewBatch(
      [makeTarget(opponentOnly, 1, 900), makeTarget(primary, 2, 800)],
      [primary, opponentOnly],
      ['pyra', 'mythra'],
      8,
    )
    expect(batch.map((target) => target.vodId)).toEqual(['primary'])
  })

  it('selects a deterministic diverse primary-side batch', () => {
    const a = makeVod('a', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'])
    const b = makeVod('b', 'shuton', ['pyra', 'mythra'], 'KEN', ['sonic'])
    const c = makeVod('c', 'sparg0', ['pyra', 'mythra'], 'Chugs', ['hero'])
    const vods = [a, b, c]
    const targets = [makeTarget(a, 1, 900), makeTarget(b, 2, 895), makeTarget(c, 3, 880)]
    const first = buildPrimaryFighterReviewBatch(targets, vods, ['pyra', 'mythra'], 2)
    const second = buildPrimaryFighterReviewBatch([...targets].reverse(), [...vods].reverse(), ['pyra', 'mythra'], 2)
    expect(first.map((target) => target.vodId)).toEqual(second.map((target) => target.vodId))
    expect(first.map((target) => target.rank)).toEqual([1, 2])
    expect(new Set(first.map((target) => target.playerId)).size).toBe(2)
  })

  it('builds metadata-only worksheets without invented gameplay fields', () => {
    const vod = makeVod('worksheet', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'])
    const worksheet = buildAnnotationWorksheet(vod)
    expect(worksheet).toMatchObject({
      vodId: 'worksheet',
      playerId: 'shuton',
      opponentTag: 'Light',
      status: 'gameplay-observations-pending',
    })
    expect(worksheet.checklist.length).toBeGreaterThanOrEqual(5)
    expect('chosenOption' in worksheet).toBe(false)
    expect('observableOutcome' in worksheet).toBe(false)
    expect('timestampSeconds' in worksheet).toBe(false)
  })

  it('blocks status promotion until each evidence gate is satisfied', () => {
    const queued = makeVod('queued', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'])
    expect(validateVodAnalysisTransition(queued, 'annotated', []).valid).toBe(false)
    expect(validateVodAnalysisTransition(queued, 'annotated', []).errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['analysis-without-eligible-evidence']),
    )

    const annotated = makeVod('annotated', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'], 'annotated')
    const moment = makeMoment('moment-reviewed', annotated, 'pyra', 'fox')
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
      ...makeVod('source-index', 'shuton', ['pyra', 'mythra'], 'Light', ['fox'], 'cataloged'),
      videoUrl: 'https://example.com/index',
      videoProvider: 'other',
      linkKind: 'source-index',
      quality: { ...makeVod('quality', 'shuton', ['pyra'], 'Light', ['fox']).quality, visibleGameplay: false },
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
        index < 4 ? 'shuton' : 'sparg0',
        ['pyra', 'mythra'],
        `Opponent ${index}`,
        [opponents[index % opponents.length]!],
      ),
    )
    const contexts: ProDecisionMoment['context'][] = ['neutral', 'advantage', 'ledge']
    const moments = vods.map((vod, index) =>
      makeMoment(`moment-${index}`, vod, index % 2 === 0 ? 'pyra' : 'mythra', vod.opponentFighterIds[0]!, contexts[index % contexts.length]!),
    )
    const progress = summarizeFighterEvidenceProgress(['pyra', 'mythra'], vods, moments, 8)
    expect(progress).toMatchObject({
      reviewedSetCount: 8,
      representativePlayerCount: 2,
      opponentFighterCount: 4,
      contextCount: 3,
      status: 'sampling-target-met',
    })
  })

  it('ships a real Aegis review pack while leaving tactical evidence empty', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(proAegisPilotReviewBatch.length).toBeGreaterThan(0)
    expect(proAegisPilotReviewBatch.length).toBeLessThanOrEqual(8)
    expect(proAegisPilotWorksheets).toHaveLength(proAegisPilotReviewBatch.length)

    for (const target of proAegisPilotReviewBatch) {
      const vod = proVodCatalog.find((entry) => entry.id === target.vodId)
      expect(vod).toBeTruthy()
      expect(vod?.playerFighterIds.some((fighterId) => fighterId === 'pyra' || fighterId === 'mythra')).toBe(true)
    }

    expect(proAegisPilotProgress.reviewedSetCount).toBe(0)
    expect(proAegisPilotProgress.status).toBe('review-not-started')
    expect(proDecisionMoments).toHaveLength(0)
  })
})
