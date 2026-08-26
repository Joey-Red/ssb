import { describe, expect, it } from 'vitest'
import type { FighterFrameData } from '../types'
import { extractProPatterns } from '../lib/proLab'
import {
  auditProLabCatalog,
  buildCharacterLessons,
  buildDecisionExercise,
  buildDecisionExercises,
  buildPlayerComparisons,
  buildPracticeDrillFromMoment,
  buildProRosterCoverage,
  buildTemporalEvidenceIndex,
  extractMatchupPatterns,
  resolveFrameDataReference,
} from '../lib/proLabRelease'
import {
  proCharacterLessons,
  proDecisionExercises,
  proDecisionMoments,
  proLabReferenceDate,
  proLabReleaseStats,
  proMaintenanceReport,
  proMatchupPatterns,
  proPlayerComparisons,
  proRosterCoverage,
  proTemporalEvidence,
} from './proLab'
import { roster } from './roster'
import type { ProDecisionMoment, ProPlayerRepresentative, ProVodRecord } from './proLabTypes'
import { proFighterResearchRegistry, proPlayerRepresentatives } from './proLabRoster'
import { proVodCatalog } from './proLabVods'

const moment = (
  id: string,
  vodId: string,
  playerFighterId = 'fox',
  opponentFighterId = 'luigi',
  teachingTag = 'whiff-punish spacing',
): ProDecisionMoment => ({
  id,
  vodId,
  game: 1,
  timestampSeconds: id.endsWith('2') ? 48 : 22,
  fighterId: playerFighterId,
  opponentFighterId,
  context: 'neutral',
  state: {
    playerStocks: 3,
    opponentStocks: 3,
    playerPercent: 37,
    opponentPercent: 42,
    stage: 'Synthetic test stage',
    position: 'center',
  },
  chosenOption: 'dash back then punish the whiff',
  observableOutcome: 'The test opponent misses and the test fighter lands a punish.',
  interpretation: 'The spacing suggests the punish was enabled by waiting outside the test option.',
  plausibleAlternatives: ['hold center', 'jump away'],
  evidenceClass: 'strong-inference',
  confidence: 0.9,
  teachingTags: [teachingTag],
  frameDataReferences: [{ fighterId: playerFighterId, moveName: 'Neutral Air', metrics: ['startup', 'landingLag'] }],
})

const playerIdByVod = { 'vod-a': 'player-a', 'vod-b': 'player-b', 'vod-c': 'player-a', 'vod-d': 'player-b' }

const syntheticMoments = [
  moment('moment-1', 'vod-a'),
  moment('moment-2', 'vod-b'),
  moment('moment-3', 'vod-c'),
  moment('moment-4', 'vod-d'),
]

const fakeFrameData: FighterFrameData = {
  fighterId: 'fox',
  name: 'Fox',
  sourceUrl: 'https://example.test/frame-source',
  stats: {
    weight: null,
    gravity: null,
    walkSpeed: null,
    runSpeed: null,
    initialDash: null,
    airSpeed: null,
    airAcceleration: null,
    fallSpeed: null,
    fastFallSpeed: null,
  },
  moves: [{
    id: 'neutral-air',
    name: 'Neutral Air',
    category: 'aerial',
    startup: '4',
    startupFrame: 4,
    active: '4-6/7-31',
    totalFrames: '38',
    faf: '39',
    landingLag: '7',
    autocancel: null,
    damage: null,
    onShield: '-3',
    shieldLag: null,
    shieldStun: null,
    hitboxType: null,
    endLag: null,
    notes: null,
  }],
}

describe('M81-M90 Pro Lab release systems', () => {
  it('M81 builds traceable character lessons only from repeated reviewed patterns', () => {
    const patterns = extractProPatterns(syntheticMoments, { playerIdByVod })
    const lessons = buildCharacterLessons(['fox'], patterns, syntheticMoments)
    expect(patterns.length).toBeGreaterThan(0)
    expect(lessons[0]?.status).toBe('ready')
    expect(lessons[0]?.claims.length).toBeGreaterThan(1)
    for (const claim of lessons[0]?.claims ?? []) {
      expect(claim.evidenceMomentIds.length).toBeGreaterThan(0)
      expect(claim.evidenceVodIds.length).toBeGreaterThan(0)
      expect(claim.statement.toLowerCase()).not.toContain('was thinking')
    }
  })

  it('M82 decision exercises reveal reviewed outcomes only after a separate learner choice', () => {
    const exercise = buildDecisionExercise(syntheticMoments[0]!)
    expect(exercise).not.toBeNull()
    expect(exercise?.options).toContain(syntheticMoments[0]!.chosenOption)
    expect(exercise?.options.length).toBeGreaterThanOrEqual(2)
    expect(exercise?.prompt).not.toContain(syntheticMoments[0]!.chosenOption)
    expect(exercise?.prompt).not.toContain(syntheticMoments[0]!.observableOutcome)
    expect(exercise?.observableOutcome).toBe(syntheticMoments[0]!.observableOutcome)

    const speculative = { ...syntheticMoments[0]!, id: 'speculative', evidenceClass: 'speculative' as const, confidence: 0.99 }
    expect(buildDecisionExercise(speculative)).toBeNull()
  })

  it('M83 resolves numeric teaching references from the committed frame-data model instead of copied numbers', () => {
    const reference = syntheticMoments[0]!.frameDataReferences?.[0]
    expect(reference).toBeTruthy()
    const resolved = resolveFrameDataReference(fakeFrameData, reference!)
    expect(resolved?.sourceUrl).toBe(fakeFrameData.sourceUrl)
    expect(resolved?.metrics).toEqual([
      { key: 'startup', label: 'Startup', value: '4' },
      { key: 'landingLag', label: 'Landing lag', value: '7' },
    ])
  })

  it('M84 converts eligible reviewed decisions into local-drill-compatible seeds', () => {
    const drill = buildPracticeDrillFromMoment(syntheticMoments[0]!)
    expect(drill?.fighterId).toBe('fox')
    expect(drill?.route).toEqual([syntheticMoments[0]!.chosenOption])
    expect(drill?.percent).toBe(37)
    expect(drill?.targetReps).toBeGreaterThan(0)
    expect(drill?.notes).toContain(syntheticMoments[0]!.id)
  })

  it('M85 withholds matchup claims until repeated opponent-specific evidence spans multiple VODs', () => {
    expect(extractMatchupPatterns([syntheticMoments[0]!], { playerIdByVod })).toHaveLength(0)
    const patterns = extractMatchupPatterns(syntheticMoments, { playerIdByVod })
    expect(patterns.length).toBeGreaterThan(0)
    expect(patterns[0]?.opponentFighterId).toBe('luigi')
    expect(patterns[0]?.vodCount).toBeGreaterThanOrEqual(2)
  })

  it('M86 compares styles only when reviewed evidence exists for at least two players of one fighter', () => {
    const onePlayer = buildPlayerComparisons(syntheticMoments.filter((entry) => playerIdByVod[entry.vodId as keyof typeof playerIdByVod] === 'player-a'), playerIdByVod)
    expect(onePlayer).toHaveLength(0)
    const comparisons = buildPlayerComparisons(syntheticMoments, playerIdByVod)
    expect(comparisons).toHaveLength(1)
    expect(comparisons[0]?.playerIds).toEqual(['player-a', 'player-b'])
    expect(comparisons[0]?.evidenceMomentIds).toHaveLength(4)
  })

  it('M87 keeps explicit current/recent/legacy era labels and never infers an unknown patch', () => {
    const activePlayer: ProPlayerRepresentative = {
      id: 'player-a',
      tag: 'Player A',
      country: 'Test',
      region: 'Test',
      status: 'active',
      characterRoles: [{ fighterId: 'fox', role: 'main' }],
      sourceUrls: ['https://example.test/player'],
    }
    const legacyPlayer: ProPlayerRepresentative = { ...activePlayer, id: 'legacy-player', status: 'legacy' }
    const baseVod: ProVodRecord = {
      id: 'era-current',
      title: 'Synthetic era fixture',
      playerId: 'player-a',
      playerFighterIds: ['fox'],
      opponentTag: 'Fixture',
      opponentFighterIds: ['luigi'],
      event: 'Fixture',
      eventTier: 'major',
      date: '2026-01-01',
      round: 'Fixture',
      videoUrl: 'https://example.test/vod',
      videoProvider: 'other',
      gameVersion: 'unknown',
      sourceUrls: ['https://example.test/vod', 'https://example.test/event'],
      analysisStatus: 'reviewed',
      quality: { tournamentEnvironment: true, fullSet: true, officialOrTournamentChannel: true, visibleGameplay: true, patchKnown: false, score: 100, notes: [] },
    }
    const entries = buildTemporalEvidenceIndex([
      baseVod,
      { ...baseVod, id: 'era-recent', date: '2023-01-01' },
      { ...baseVod, id: 'era-legacy-player', playerId: 'legacy-player' },
    ], [activePlayer, legacyPlayer], '2026-08-26')
    expect(entries.map((entry) => entry.era)).toEqual(['current', 'recent', 'legacy'])
    expect(entries[0]?.gameVersion).toBe('unknown')
    expect(entries[0]?.reasons.join(' ')).toContain('not inferred')
  })

  it('M88 structural maintenance reports duplicates, malformed URLs and roster catalog gaps without runtime checks', () => {
    const duplicate = { ...proVodCatalog[0]!, id: 'synthetic-duplicate' }
    const temporal = buildTemporalEvidenceIndex([...proVodCatalog, duplicate], proPlayerRepresentatives, proLabReferenceDate)
    const report = auditProLabCatalog([...proVodCatalog, duplicate], roster.map((fighter) => fighter.id), temporal, proLabReferenceDate)
    expect(report.duplicateLearningRecords).toContain('synthetic-duplicate')
    expect(report.externalLinkHealth).toBe('maintenance-workflow-required')
    expect(report.fightersWithoutCatalogedVods.length).toBeGreaterThan(0)
  })

  it('M89 indexes all 89 fighters and keeps sparse research explicit instead of fabricating coverage', () => {
    const coverage = buildProRosterCoverage({
      fighterIds: roster.map((fighter) => fighter.id),
      research: proFighterResearchRegistry,
      players: proPlayerRepresentatives,
      vods: proVodCatalog,
      temporal: proTemporalEvidence,
      moments: [],
      lessons: buildCharacterLessons(roster.map((fighter) => fighter.id), [], []),
      exercises: buildDecisionExercises([]),
      matchupPatterns: [],
      comparisons: [],
    })
    expect(coverage).toHaveLength(89)
    expect(new Set(coverage.map((entry) => entry.fighterId)).size).toBe(89)
    expect(coverage.some((entry) => entry.state === 'research-queued')).toBe(true)
    expect(coverage.every((entry) => entry.reviewedMomentCount === 0)).toBe(true)
  })

  it('M90 production release exports a truthful first-class full-roster evidence state', () => {
    expect(proRosterCoverage).toHaveLength(roster.length)
    expect(proLabReleaseStats.fighters).toBe(89)
    expect(proLabReleaseStats.distinctVideos).toBeGreaterThan(0)
    expect(proMaintenanceReport.malformedUrls).toHaveLength(0)
    expect(proDecisionMoments).toHaveLength(0)
    expect(proDecisionExercises).toHaveLength(0)
    expect(proMatchupPatterns).toHaveLength(0)
    expect(proPlayerComparisons).toHaveLength(0)
    expect(proCharacterLessons.every((lesson) => lesson.claims.length === 0)).toBe(true)
    expect(proLabReleaseStats.teachingReadyFighters).toBe(0)
  })
})
