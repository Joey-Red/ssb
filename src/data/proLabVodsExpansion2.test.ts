import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { proPlayerRepresentatives, proFighterResearchRegistry } from './proLabRosterAll'
import { proPlayerRepresentatives2026Batch2 } from './proLabRoster2026Batch2'
import { proVodCatalog2026Batch2 } from './proLabVods2026Batch2'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

describe('Pro Lab extensive VOD library batch 2', () => {
  const rosterIds = new Set(roster.map((fighter) => fighter.id))

  it('adds a second substantial current-season acquisition batch', () => {
    expect(proVodCatalog2026Batch2).toHaveLength(9)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(46)
    expect(proVodCatalog.filter((vod) => vod.date.startsWith('2026-')).length).toBeGreaterThanOrEqual(36)
  })

  it('adds provenance-backed representatives for additional styles and sparse characters', () => {
    expect(proPlayerRepresentatives2026Batch2).toHaveLength(5)
    expect(proPlayerRepresentatives.length).toBeGreaterThanOrEqual(44)
    expect(new Set(proPlayerRepresentatives.map((player) => player.id)).size).toBe(proPlayerRepresentatives.length)

    for (const player of proPlayerRepresentatives2026Batch2) {
      expect(player.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(player.characterRoles.length).toBeGreaterThan(0)
      expect(player.characterRoles.every((role) => rosterIds.has(role.fighterId))).toBe(true)
      for (const role of player.characterRoles) {
        expect(proFighterResearchRegistry.find((entry) => entry.fighterId === role.fighterId)?.representativeIds).toContain(player.id)
      }
    }
  })

  it('keeps every new VOD source-backed without claiming tactical review', () => {
    const playerIds = new Set(proPlayerRepresentatives.map((player) => player.id))
    for (const vod of proVodCatalog2026Batch2) {
      expect(playerIds.has(vod.playerId)).toBe(true)
      expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(vod.videoUrl.startsWith('https://www.youtube.com/watch?v=')).toBe(true)
      expect(vod.videoId).toBeTruthy()
      expect(vod.analysisStatus).toBe('review-queued')
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
    }
  })

  it('expands previously thin fighter libraries through both sides of verified sets', () => {
    expect(getProVodsForFighter('roy').filter((vod) => vod.event === 'MomoCon 2026').length).toBeGreaterThanOrEqual(4)
    expect(getProVodsForFighter('hero').filter((vod) => vod.event === 'MomoCon 2026').length).toBeGreaterThanOrEqual(2)
    expect(getProVodsForFighter('ken').some((vod) => vod.id === 'momocon-2026-jahzz0-jakal-l8')).toBe(true)
    expect(getProVodsForFighter('wolf').some((vod) => vod.id === 'momocon-2026-jahzz0-jakal-l8')).toBe(true)
    expect(getProVodsForFighter('captain-falcon').some((vod) => vod.id === 'momocon-2026-fatality-jojo')).toBe(true)
    expect(getProVodsForFighter('zero-suit-samus').some((vod) => vod.id === 'momocon-2026-fatality-jojo')).toBe(true)
  })
})
