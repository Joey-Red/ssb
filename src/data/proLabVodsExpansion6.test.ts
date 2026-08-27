import { describe, expect, it } from 'vitest'
import { isCatalogQuality } from '../lib/proLab'
import { roster } from './roster'
import { proVodLinkResolutionQueue, proVodReviewQueue } from './proLabReviewQueueAll'
import { proPlayerRepresentatives } from './proLabRosterAll'
import {
  proVodCatalogHistoricalBatch6,
  proVodCatalogHistoricalBatch6A,
  proVodCatalogHistoricalBatch6B,
  proVodCatalogHistoricalBatch6C,
} from './proLabVodsHistoricalBatch6'
import { proVodCatalog } from './proLabVodsAll'

describe('Pro Lab historical bulk acquisition batch 6', () => {
  const rosterIds = new Set<string>(roster.map((fighter) => fighter.id))
  const playerIds = new Set<string>(proPlayerRepresentatives.map((player) => player.id))
  const historicalIds = new Set(proVodCatalogHistoricalBatch6.map((vod) => vod.id))

  it('adds exactly 300 independently addressable historical set records', () => {
    expect(proVodCatalogHistoricalBatch6A).toHaveLength(100)
    expect(proVodCatalogHistoricalBatch6B).toHaveLength(100)
    expect(proVodCatalogHistoricalBatch6C).toHaveLength(100)
    expect(proVodCatalogHistoricalBatch6).toHaveLength(300)
    expect(historicalIds.size).toBe(300)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(507)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(proVodCatalog.length)
  })

  it('keeps all 300 at honest source-index acquisition state', () => {
    for (const vod of proVodCatalogHistoricalBatch6) {
      expect(playerIds.has(vod.playerId), vod.id).toBe(true)
      expect(vod.playerFighterIds.length, vod.id).toBeGreaterThan(0)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
      expect(vod.opponentFighterIds, vod.id).toHaveLength(0)
      expect(vod.linkKind, vod.id).toBe('source-index')
      expect(vod.videoProvider, vod.id).toBe('other')
      expect(vod.videoId, vod.id).toBeUndefined()
      expect(vod.analysisStatus, vod.id).toBe('cataloged')
      expect(vod.datePrecision, vod.id).toBe('event-anchor')
      expect(vod.gameVersion, vod.id).toBe('unknown')
      expect(vod.quality.visibleGameplay, vod.id).toBe(false)
      expect(vod.quality.officialOrTournamentChannel, vod.id).toBe(false)
      expect(vod.quality.patchKnown, vod.id).toBe(false)
      expect(isCatalogQuality(vod.quality), vod.id).toBe(true)
      expect(vod.sourceUrls.length, vod.id).toBeGreaterThanOrEqual(2)
      expect(vod.sourceUrls.every((url) => url.includes('smash-tube.com')), vod.id).toBe(true)
      expect(vod.quality.notes.some((note) => note.includes('source-index date anchor')), vod.id).toBe(true)
    }
  })

  it('routes unresolved historical records to link resolution and resolved records to review', () => {
    const linkResolutionIds = new Set(proVodLinkResolutionQueue.map((vod) => vod.id))
    const reviewVodIds = new Set(proVodReviewQueue.map((target) => target.vodId).filter(Boolean))
    const productionById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

    for (const sourceVod of proVodCatalogHistoricalBatch6) {
      const productionVod = productionById.get(sourceVod.id)
      expect(productionVod, sourceVod.id).toBeDefined()
      if (productionVod?.linkKind === 'source-index') {
        expect(linkResolutionIds.has(sourceVod.id), sourceVod.id).toBe(true)
        expect(reviewVodIds.has(sourceVod.id), sourceVod.id).toBe(false)
      } else {
        expect(productionVod?.linkKind, sourceVod.id).toBe('direct-video')
        expect(linkResolutionIds.has(sourceVod.id), sourceVod.id).toBe(false)
        expect(reviewVodIds.has(sourceVod.id), sourceVod.id).toBe(true)
      }
    }
  })

  it('adds broad post-final-patch-era depth rather than only current-season records', () => {
    const countYear = (year: string) => proVodCatalogHistoricalBatch6.filter((vod) => vod.date.startsWith(`${year}-`)).length
    expect(countYear('2026')).toBeGreaterThanOrEqual(75)
    expect(countYear('2025')).toBeGreaterThanOrEqual(45)
    expect(countYear('2024')).toBeGreaterThanOrEqual(80)
    expect(countYear('2023')).toBeGreaterThanOrEqual(45)
    expect(countYear('2022')).toBeGreaterThanOrEqual(3)
    expect(countYear('2021')).toBeGreaterThanOrEqual(3)
    expect(new Set(proVodCatalogHistoricalBatch6.map((vod) => vod.playerId)).size).toBeGreaterThanOrEqual(25)
  })

  it('does not promote acquisition metadata into tactical or patch claims', () => {
    expect(proVodCatalogHistoricalBatch6.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
    expect(proVodCatalogHistoricalBatch6.some((vod) => vod.quality.visibleGameplay || vod.quality.patchKnown)).toBe(false)
    expect(proVodCatalogHistoricalBatch6.some((vod) => vod.result !== undefined)).toBe(false)
  })
})
