import { describe, expect, it } from 'vitest'
import { isCatalogQuality } from '../lib/proLab'
import { roster } from './roster'
import { proVodYoutubeResolutions2026Batch5 } from './proLabVodLinkResolutions2026Batch5'
import { proVodYoutubeResolutionsBulk2 } from './proLabVodLinkResolutionsBulk2'
import { proVodYoutubeResolutionsBulk3 } from './proLabVodLinkResolutionsBulk3'
import { proVodLinkResolutionQueue, proVodReviewQueue } from './proLabReviewQueueAll'
import { proFighterResearchRegistry, proPlayerRepresentatives } from './proLabRosterAll'
import { proPlayerRepresentatives2026Batch5 } from './proLabRoster2026Batch5'
import { proVodCatalog2026Batch5 } from './proLabVods2026Batch5'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

describe('Pro Lab large acquisition batch 5', () => {
  const rosterIds = new Set<string>(roster.map((fighter) => fighter.id))
  const playerIds = new Set<string>(proPlayerRepresentatives.map((player) => player.id))
  const batchIds = new Set<string>(proVodCatalog2026Batch5.map((vod) => vod.id))
  const resolvedIds = new Set<string>([
    ...Object.keys(proVodYoutubeResolutions2026Batch5),
    ...Object.keys(proVodYoutubeResolutionsBulk2),
    ...Object.keys(proVodYoutubeResolutionsBulk3),
  ])

  it('adds 61 source-backed current-season set records in one pass', () => {
    expect(proVodCatalog2026Batch5).toHaveLength(61)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(207)
    expect(proVodCatalog.filter((vod) => vod.date.startsWith('2026-')).length).toBeGreaterThanOrEqual(197)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(proVodCatalog.length)
  })

  it('keeps source-index discovery and resolved watch targets explicitly separate', () => {
    const indexed = proVodCatalog2026Batch5.filter((vod) => vod.linkKind === 'source-index')
    const direct = proVodCatalog2026Batch5.filter((vod) => vod.linkKind === 'direct-video')
    expect(indexed).toHaveLength(51)
    expect(direct).toHaveLength(10)

    for (const vod of indexed) {
      expect(vod.analysisStatus).toBe('cataloged')
      expect(vod.videoProvider).toBe('other')
      expect(vod.videoUrl).toContain('smash-tube.com')
      expect(vod.quality.visibleGameplay).toBe(false)
      const isResolvedDownstream = resolvedIds.has(vod.id)
      expect(proVodLinkResolutionQueue.some((entry) => entry.id === vod.id), vod.id).toBe(!isResolvedDownstream)
      if (isResolvedDownstream) {
        const resolvedVod = proVodCatalog.find((entry) => entry.id === vod.id)
        expect(resolvedVod?.linkKind, vod.id).toBe('direct-video')
        expect(proVodReviewQueue.some((entry) => entry.videoUrl === resolvedVod?.videoUrl), vod.id).toBe(true)
      } else {
        expect(proVodReviewQueue.some((entry) => entry.vodId === vod.id), vod.id).toBe(false)
      }
    }

    for (const vod of direct) {
      expect(vod.analysisStatus).toBe('review-queued')
      expect(vod.videoProvider).toBe('youtube')
      expect(vod.videoId).toBeTruthy()
      expect(vod.videoUrl).toBe(`https://www.youtube.com/watch?v=${vod.videoId}`)
      expect(vod.quality.visibleGameplay).toBe(true)
      expect(proVodReviewQueue.some((entry) => entry.videoUrl === vod.videoUrl), vod.id).toBe(true)
    }
  })

  it('upgrades five prior Patchwork indexes to exact YouTube watch targets', () => {
    expect(Object.keys(proVodYoutubeResolutions2026Batch5)).toHaveLength(5)
    for (const [vodId, youtubeId] of Object.entries(proVodYoutubeResolutions2026Batch5)) {
      const vod = proVodCatalog.find((entry) => entry.id === vodId)
      expect(vod, vodId).toBeTruthy()
      expect(vod?.linkKind).toBe('direct-video')
      expect(vod?.videoProvider).toBe('youtube')
      expect(vod?.videoId).toBe(youtubeId)
      expect(vod?.videoUrl).toBe(`https://www.youtube.com/watch?v=${youtubeId}`)
      expect(vod?.analysisStatus).toBe('review-queued')
      expect(proVodLinkResolutionQueue.some((entry) => entry.id === vodId), vodId).toBe(false)
      expect(proVodReviewQueue.some((entry) => entry.videoUrl === vod?.videoUrl), vodId).toBe(true)
    }
  })

  it('adds three provenance-backed representatives and keeps every record canonical', () => {
    expect(proPlayerRepresentatives2026Batch5).toHaveLength(3)
    expect(proPlayerRepresentatives.length).toBeGreaterThanOrEqual(64)
    expect(new Set(proPlayerRepresentatives.map((player) => player.id)).size).toBe(proPlayerRepresentatives.length)

    for (const player of proPlayerRepresentatives2026Batch5) {
      expect(player.sourceUrls.length).toBeGreaterThanOrEqual(2)
      for (const role of player.characterRoles) {
        expect(rosterIds.has(role.fighterId), `${player.id}:${role.fighterId}`).toBe(true)
        expect(proFighterResearchRegistry.find((entry) => entry.fighterId === role.fighterId)?.representativeIds).toContain(player.id)
      }
    }

    for (const vod of proVodCatalog2026Batch5) {
      expect(playerIds.has(vod.playerId), vod.id).toBe(true)
      expect(vod.playerFighterIds.length, vod.id).toBeGreaterThan(0)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
      expect(vod.sourceUrls.length, vod.id).toBeGreaterThanOrEqual(2)
      expect(isCatalogQuality(vod.quality), vod.id).toBe(true)
      expect(vod.date.startsWith('2026-'), vod.id).toBe(true)
    }
  })

  it('makes another large dent in thin-character libraries', () => {
    const widened: readonly string[] = [
      'bowser-jr', 'young-link', 'duck-hunt', 'byleth', 'sephiroth', 'ice-climbers',
      'little-mac', 'robin', 'ike', 'mii-brawler', 'richter', 'olimar', 'king-k-rool',
      'pac-man', 'sora', 'terry',
    ]
    for (const fighterId of widened) {
      expect(getProVodsForFighter(fighterId).some((vod) => batchIds.has(vod.id)), fighterId).toBe(true)
    }
  })

  it('does not fabricate tactical review state while accelerating acquisition', () => {
    expect(proVodCatalog2026Batch5.every((vod) => vod.analysisStatus === 'cataloged' || vod.analysisStatus === 'review-queued')).toBe(true)
    expect(proVodCatalog2026Batch5.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
    expect(proVodCatalog2026Batch5.every((vod) => vod.gameVersion === 'unknown')).toBe(true)
  })
})
