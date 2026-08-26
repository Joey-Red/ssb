import { describe, expect, it } from 'vitest'
import { buildSetBreakdown, extractProPatterns, isCatalogQuality, isTeachingEligibleMoment } from '../lib/proLab'
import { roster } from './roster'
import { proFighterResearchRegistry, proLabPilotFighterIds, proPlayerRepresentatives } from './proLabRoster'
import type { ProDecisionMoment } from './proLabTypes'
import { getProVodsForFighter, proVodCatalog } from './proLabVods'

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
  const rosterIds = new Set(roster.map((fighter) => fighter.id))
  const playerIds = new Set(proPlayerRepresentatives.map((player) => player.id))

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

  it('keeps pilot VOD records source-backed and internally resolvable', () => {
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(8)
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
      expect(vod.quality.visibleGameplay).toBe(true)
      expect(isCatalogQuality(vod.quality)).toBe(true)
      expect(vod.analysisStatus).toBe('review-queued')
      if (vod.videoProvider === 'youtube') expect(vod.videoId).toBeTruthy()
    }
  })

  it('covers every pilot fighter with at least one competitive VOD', () => {
    for (const fighterId of proLabPilotFighterIds) {
      expect(getProVodsForFighter(fighterId).length, fighterId).toBeGreaterThan(0)
    }
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
