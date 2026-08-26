import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { proVodCatalog2026Batch1 } from './proLabVods2026Batch1'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

describe('Pro Lab extensive VOD library', () => {
  it('ships a substantial first 2026 expansion batch', () => {
    expect(proVodCatalog2026Batch1).toHaveLength(19)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(37)
    expect(proVodCatalog.filter((vod) => vod.date.startsWith('2026-')).length).toBeGreaterThanOrEqual(27)
  })

  it('keeps expansion records source-backed and canonical', () => {
    const rosterIds = new Set(roster.map((fighter) => fighter.id))
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(proVodCatalog.length)

    for (const vod of proVodCatalog2026Batch1) {
      expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(vod.videoUrl.startsWith('https://')).toBe(true)
      expect(vod.analysisStatus).toBe('review-queued')
      expect(vod.quality.score).toBeGreaterThan(0)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId))).toBe(true)
    }
  })

  it('indexes a set for both characters instead of only the primary study player', () => {
    const diddySets = getProVodsForFighter('diddy-kong')
    const steveSets = getProVodsForFighter('steve')
    expect(diddySets.some((vod) => vod.id === 'kagaribi15-stream-acola-tweek-wqf-vod')).toBe(true)
    expect(steveSets.some((vod) => vod.id === 'kagaribi15-stream-acola-tweek-wqf-vod')).toBe(true)
  })

  it('retains distinct navigation coordinates for full-stream set records', () => {
    const streamSets = proVodCatalog2026Batch1.filter((vod) => vod.videoId === 'mVflVyrWS5Y')
    expect(streamSets).toHaveLength(12)
    expect(streamSets.every((vod) => vod.startSeconds !== undefined)).toBe(true)
    expect(new Set(streamSets.map((vod) => vod.startSeconds)).size).toBe(streamSets.length)
  })
})
