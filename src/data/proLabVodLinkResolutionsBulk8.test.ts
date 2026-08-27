import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk8 } from './proLabVodLinkResolutionsBulk8'
import { proVodLinkResolutionQueue } from './proLabReviewQueueAll'
import { proVodCatalog } from './proLabVodsAll'

const entries = Object.entries(proVodYoutubeResolutionsBulk8)
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab zero-candidate recovery batch', () => {
  it('contains exactly ten corroborated YouTube mappings', () => {
    expect(entries).toHaveLength(10)
    expect(new Set(entries.map(([vodId]) => vodId)).size).toBe(10)
    for (const [vodId, youtubeId] of entries) {
      expect(catalogById.has(vodId), vodId).toBe(true)
      expect(youtubeId, vodId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('promotes every mapping to direct review-queued footage', () => {
    for (const [vodId, youtubeId] of entries) {
      const vod = catalogById.get(vodId)
      expect(vod?.linkKind, vodId).toBe('direct-video')
      expect(vod?.videoProvider, vodId).toBe('youtube')
      expect(vod?.videoId, vodId).toBe(youtubeId)
      expect(vod?.videoUrl, vodId).toBe(`https://www.youtube.com/watch?v=${youtubeId}`)
      expect(vod?.analysisStatus, vodId).toBe('review-queued')
      expect(vod?.quality.visibleGameplay, vodId).toBe(true)
      expect(proVodLinkResolutionQueue.some((entry) => entry.id === vodId), vodId).toBe(false)
    }
  })

  it('preserves all 800 records while reducing source indexes from 96 to 86', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(800)
    expect(proVodCatalog.filter((vod) => vod.linkKind === 'source-index')).toHaveLength(86)
    expect(proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')).toHaveLength(714)
  })

  it('does not infer tactical review completion from direct-link recovery', () => {
    const mappedIds = new Set(entries.map(([vodId]) => vodId))
    const mapped = proVodCatalog.filter((vod) => mappedIds.has(vod.id))
    expect(mapped).toHaveLength(10)
    expect(mapped.every((vod) => vod.analysisStatus === 'review-queued')).toBe(true)
    expect(mapped.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
  })
})
