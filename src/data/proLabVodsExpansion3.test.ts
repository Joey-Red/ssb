import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { proFighterResearchRegistry, proPlayerRepresentatives } from './proLabRosterAll'
import { proPlayerRepresentatives2026Batch3 } from './proLabRoster2026Batch3'
import { proVodCatalog2026Batch3 } from './proLabVods2026Batch3'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

describe('Pro Lab extensive VOD library batch 3', () => {
  const rosterIds = new Set(roster.map((fighter) => fighter.id))

  it('adds a thin-character-focused current-season acquisition batch', () => {
    expect(proVodCatalog2026Batch3).toHaveLength(11)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(57)
    expect(proVodCatalog.filter((vod) => vod.date.startsWith('2026-')).length).toBeGreaterThanOrEqual(47)
  })

  it('adds provenance-backed representatives for sparse fighter libraries', () => {
    expect(proPlayerRepresentatives2026Batch3).toHaveLength(8)
    expect(proPlayerRepresentatives.length).toBeGreaterThanOrEqual(52)
    expect(new Set(proPlayerRepresentatives.map((player) => player.id)).size).toBe(proPlayerRepresentatives.length)

    for (const player of proPlayerRepresentatives2026Batch3) {
      expect(player.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(player.characterRoles.length).toBeGreaterThan(0)
      expect(player.characterRoles.every((role) => rosterIds.has(role.fighterId))).toBe(true)
      for (const role of player.characterRoles) {
        expect(proFighterResearchRegistry.find((entry) => entry.fighterId === role.fighterId)?.representativeIds).toContain(player.id)
      }
    }
  })

  it('keeps every new VOD source-backed and review-queued', () => {
    const playerIds = new Set(proPlayerRepresentatives.map((player) => player.id))
    for (const vod of proVodCatalog2026Batch3) {
      expect(playerIds.has(vod.playerId)).toBe(true)
      expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(vod.videoUrl.startsWith('https://www.youtube.com/watch?v=')).toBe(true)
      expect(vod.videoId).toBeTruthy()
      expect(vod.analysisStatus).toBe('review-queued')
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
    }
  })

  it('opens current VOD coverage for previously thin characters', () => {
    const expectedFighters = [
      'kirby',
      'robin',
      'meta-knight',
      'little-mac',
      'piranha-plant',
      'isabelle',
      'villager',
    ]

    for (const fighterId of expectedFighters) {
      expect(getProVodsForFighter(fighterId).some((vod) => proVodCatalog2026Batch3.some((entry) => entry.id === vod.id)), fighterId).toBe(true)
    }
  })

  it('builds a real Isabelle study run rather than a token single set', () => {
    const isabelleBatch = getProVodsForFighter('isabelle').filter((vod) => vod.event === "Maesuma'HIT #165")
    expect(isabelleBatch).toHaveLength(5)
    expect(new Set(isabelleBatch.map((vod) => vod.round))).toEqual(
      new Set(['Winners Quarterfinals', 'Winners Semifinals', 'Winners Finals', 'Losers Finals', 'Grand Finals']),
    )
  })
})
