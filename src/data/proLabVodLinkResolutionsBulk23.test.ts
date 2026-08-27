import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk2 } from './proLabVodLinkResolutionsBulk2'
import { proVodYoutubeResolutionsBulk3 } from './proLabVodLinkResolutionsBulk3'
import { proVodCatalog } from './proLabVodsAll'

const bulk2 = Object.entries(proVodYoutubeResolutionsBulk2)
const bulk3 = Object.entries(proVodYoutubeResolutionsBulk3)
const combined = [...bulk2, ...bulk3]
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab direct-link recovery batches 2 and 3', () => {
  it('contains exactly 416 verified, non-overlapping record mappings', () => {
    expect(bulk2).toHaveLength(233)
    expect(bulk3).toHaveLength(183)
    expect(combined).toHaveLength(416)
    expect(new Set(combined.map(([vodId]) => vodId)).size).toBe(416)
  })

  it('uses valid YouTube IDs and maps only records that remain in the 800-record corpus', () => {
    for (const [vodId, youtubeId] of combined) {
      expect(catalogById.has(vodId), vodId).toBe(true)
      expect(youtubeId, vodId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('promotes every recovered record to direct YouTube review-queued footage', () => {
    for (const [vodId, youtubeId] of combined) {
      const vod = catalogById.get(vodId)
      expect(vod?.linkKind, vodId).toBe('direct-video')
      expect(vod?.videoProvider, vodId).toBe('youtube')
      expect(vod?.videoId, vodId).toBe(youtubeId)
      expect(vod?.videoUrl, vodId).toBe(`https://www.youtube.com/watch?v=${youtubeId}`)
      expect(vod?.analysisStatus, vodId).toBe('review-queued')
      expect(vod?.quality.visibleGameplay, vodId).toBe(true)
    }
  })

  it('reduces the global unresolved catalog from 687 to 271 without changing corpus size', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(proVodCatalog.filter((vod) => vod.linkKind === 'source-index')).toHaveLength(271)
    expect(proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')).toHaveLength(529)
  })
})
