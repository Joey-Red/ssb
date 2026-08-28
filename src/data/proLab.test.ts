import { describe, expect, it } from 'vitest'
import { buildSetBreakdown, extractProPatterns, isCatalogQuality, isTeachingEligibleMoment } from '../lib/proLab'
import { proCoverageWorkQueue } from './proLab'
import { roster } from './roster'
import { nextProMetaResearchTargets2026, proMetaRepresentation2026 } from './proLabResearchPriorities'
import {
  proVodLinkResolutionQueue,
  proVodLinkResolutionQueueStats,
  proVodReviewQueue,
  proVodReviewQueueStats,
} from './proLabReviewQueueAll'
import { proFighterResearchRegistry, proPlayerRepresentatives } from './proLabRosterAll'
import type { ProDecisionMoment } from './proLabTypes'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

const observedMoment = (
  id: string,
  vodId: string,
  timestampSeconds: number,
  teachingTags: readonly string[],
): ProDecisionMoment => ({
  id,
  vodId,
  game: 1,
  timestampSeconds,
  fighterId: 'fox',
  context: 'neutral',
  state: { position: 'center' },
  chosenOption: 'dash back',
  observableOutcome: 'Opponent attack misses and Fox keeps actionable spacing.',
  evidenceClass: 'observed',
  confidence: 0.9,
  teachingTags,
})

describe('Pro Lab foundation', () => {
  const rosterIds = new Set<string>(roster.map((fighter) => fighter.id))
  const playerIds = new Set<string>(proPlayerRepresentatives.map((player) => player.id))

  it('tracks research state for all 89 canonical fighter pages', () => {
    expect(proFighterResearchRegistry).toHaveLength(roster.length)
    expect(new Set(proFighterResearchRegistry.map((entry) => entry.fighterId)).size).toBe(roster.length)
    expect(proFighterResearchRegistry.every((entry) => rosterIds.has(entry.fighterId))).toBe(true)
  })

  it('keeps every representative role attached to a canonical fighter', () => {
    for (const player of proPlayerRepresentatives) {
      expect(player.sourceUrls.length).toBeGreaterThan(0)
      for (const role of player.characterRoles) expect(rosterIds.has(role.fighterId)).toBe(true)
    }
  })

  it('retains the expanded current representative corpus', () => {
    expect(proPlayerRepresentatives.length).toBeGreaterThanOrEqual(39)
    expect(new Set(proPlayerRepresentatives.map((player) => player.id)).size).toBe(proPlayerRepresentatives.length)
    const seededFighters = proFighterResearchRegistry.filter((entry) => entry.representativeIds.length > 0)
    expect(seededFighters.length).toBeGreaterThanOrEqual(39)

    const currentResearchPlayers = [
      'acola',
      'doramigi',
      'hurt',
      'sonix',
      'zomba',
      'miya',
      'peabnut',
      'mkleo',
      'asimo',
      'raru',
      'syrup',
      'masa',
      'raflow',
      'ouch',
      'tea',
      'karaage',
      'snow-jp',
      'raki',
      'yopi',
      'kola',
      'tarik',
      'mild-na-ho',
      'akakikusu',
    ]
    for (const playerId of currentResearchPlayers) {
      const player = proPlayerRepresentatives.find((entry) => entry.id === playerId)
      expect(player, playerId).toBeTruthy()
      expect(player?.sourceUrls.some((url) => url.includes('UltRank_Half_Year_2026')), playerId).toBe(true)
    }
  })

  it('keeps VOD records source-backed and internally resolvable', () => {
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(37)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(proVodCatalog.length)

    for (const vod of proVodCatalog) {
      expect(playerIds.has(vod.playerId)).toBe(true)
      expect(vod.playerFighterIds.length).toBeGreaterThan(0)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(vod.videoUrl.startsWith('https://')).toBe(true)
      expect(vod.quality.tournamentEnvironment).toBe(true)
      expect(vod.quality.fullSet).toBe(true)
      expect(isCatalogQuality(vod.quality)).toBe(true)

      if (vod.linkKind === 'source-index') {
        expect(vod.quality.visibleGameplay).toBe(false)
        expect(vod.analysisStatus).toBe('cataloged')
        expect(vod.videoProvider).toBe('other')
        expect(vod.datePrecision).toBe('event-anchor')
      } else {
        expect(vod.quality.visibleGameplay).toBe(true)
        expect(vod.analysisStatus).toBe('review-queued')
        if (vod.videoProvider === 'youtube') expect(vod.videoId).toBeTruthy()
      }
    }
  })

  it('keeps a meaningful current-season VOD queue without fabricating review state', () => {
    const currentSeason = proVodCatalog.filter((vod) => vod.date.startsWith('2026-'))
    expect(currentSeason.length).toBeGreaterThanOrEqual(27)
    expect(currentSeason.every((vod) => vod.analysisStatus === 'review-queued' || vod.analysisStatus === 'cataloged')).toBe(true)
    expect(new Set(currentSeason.flatMap((vod) => [...vod.playerFighterIds, ...vod.opponentFighterIds])).size).toBeGreaterThanOrEqual(15)
  })

  it('separates source-index link resolution from direct footage review work', () => {
    expect(proVodReviewQueue.length).toBeGreaterThan(0)
    expect(proVodReviewQueue.length).toBeLessThanOrEqual(proVodCatalog.length)
    expect(proVodReviewQueueStats.pending).toBe(proVodReviewQueue.length)
    expect(proVodReviewQueueStats.reviewed).toBe(0)
    expect(proVodReviewQueueStats.identityCount).toBe(proVodReviewQueue.length)
    expect(new Set(proVodReviewQueue.map((target) => target.id)).size).toBe(proVodReviewQueue.length)
    expect(new Set(proVodReviewQueue.map((target) => `${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`)).size).toBe(proVodReviewQueue.length)

    for (const target of proVodReviewQueue) {
      expect(target.videoUrl.startsWith('https://')).toBe(true)
      expect(target.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(target.fighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(target.status).not.toBe('reviewed')
      expect(proVodCatalog.find((vod) => vod.id === target.vodId)?.linkKind).not.toBe('source-index')
      if (target.setStartSeconds !== undefined) expect(target.setStartSeconds).toBeGreaterThanOrEqual(0)
    }

    expect(proVodLinkResolutionQueueStats.total).toBe(proVodLinkResolutionQueue.length)
    for (const vod of proVodLinkResolutionQueue) {
      expect(vod.linkKind).toBe('source-index')
      expect(proVodReviewQueue.some((target) => target.vodId === vod.id)).toBe(false)
    }
  })

  it('fully seeds representative research across the top-28 2026 meta representation table', () => {
    expect(proMetaRepresentation2026).toHaveLength(28)
    expect(new Set(proMetaRepresentation2026.map((entry) => entry.rank)).size).toBe(28)
    for (const entry of proMetaRepresentation2026) {
      expect(entry.fighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(entry.representationPercent).toBeGreaterThan(0)
      expect(entry.sourceUrl).toContain('UltRank_Half_Year_2026')
    }
    expect(nextProMetaResearchTargets2026).toHaveLength(0)
  })

  it('tracks full-roster VOD gaps without special pilot exceptions', () => {
    expect(roster).toHaveLength(89)
    const queuedFighterIds = new Set(proCoverageWorkQueue.map((item) => item.fighterId))
    expect(queuedFighterIds.size).toBe(89)

    const uncovered = roster.filter((fighter) => getProVodsForFighter(fighter.id).length === 0)
    const covered = roster.filter((fighter) => getProVodsForFighter(fighter.id).length > 0)
    expect(covered.length + uncovered.length).toBe(89)
    expect(covered.length).toBeGreaterThan(0)
    for (const fighter of uncovered) expect(queuedFighterIds.has(fighter.id), fighter.id).toBe(true)
  })

  it('does not promote speculative interpretation into teaching material', () => {
    const speculative: ProDecisionMoment = {
      ...observedMoment('speculative', 'vod-a', 10, ['spacing']),
      evidenceClass: 'speculative',
      interpretation: 'The player may have been thinking about a later adaptation.',
      confidence: 0.95,
    }
    expect(isTeachingEligibleMoment(speculative)).toBe(false)
  })

  it('keeps unreviewed sets queued instead of fabricating breakdowns', () => {
    expect(buildSetBreakdown('unreviewed-vod', [])).toMatchObject({
      vodId: 'unreviewed-vod',
      status: 'queued',
      decisionMomentIds: [],
      recurringHabits: [],
      adaptationNotes: [],
    })
  })

  it('builds a set breakdown only from eligible reviewed moments', () => {
    const moments = [
      observedMoment('m1', 'vod-a', 20, ['spacing']),
      observedMoment('m2', 'vod-a', 45, ['whiff punish']),
    ]
    const breakdown = buildSetBreakdown('vod-a', moments)
    expect(breakdown.status).toBe('annotated')
    expect(breakdown.decisionMomentIds).toEqual(['m1', 'm2'])
    expect(breakdown.phaseSummaries).toHaveLength(1)
  })

  it('extracts cross-VOD patterns without counting speculative moments', () => {
    const moments: ProDecisionMoment[] = [
      observedMoment('m1', 'vod-a', 20, ['whiff punish']),
      observedMoment('m2', 'vod-b', 30, ['whiff punish']),
      {
        ...observedMoment('m3', 'vod-c', 40, ['whiff punish']),
        evidenceClass: 'speculative',
        confidence: 0.99,
      },
    ]

    const patterns = extractProPatterns(moments, {
      minimumOccurrences: 2,
      minimumVods: 2,
      playerIdByVod: { 'vod-a': 'light', 'vod-b': 'kaninabe', 'vod-c': 'unknown' },
    })

    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({
      fighterId: 'fox',
      context: 'neutral',
      teachingTag: 'whiff punish',
      occurrenceCount: 2,
      vodCount: 2,
      playerIds: ['kaninabe', 'light'],
    })
    expect(patterns[0]?.statement).toContain('Observed whiff punish')
  })
})
