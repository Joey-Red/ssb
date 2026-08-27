import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk5 } from './proLabVodLinkResolutionsBulk5'
import { proVodLinkResolutionQueue } from './proLabReviewQueueAll'
import { proVodCatalog } from './proLabVodsAll'

const entries = Object.entries(proVodYoutubeResolutionsBulk5)
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab final conservative VOD recovery batch', () => {
  it('contains exactly 13 corroborated YouTube mappings', () => {
    expect(entries).toHaveLength(13)
    expect(new Set(entries.map(([vodId]) => vodId)).size).toBe(13)
    for (const [vodId, youtubeId] of entries) {
      expect(catalogById.has(vodId), vodId).toBe(true)
      expect(youtubeId, vodId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('promotes every mapped record to direct review-queued footage', () => {
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

  it('keeps all 800 records valid after later verified recovery batches', () => {
    const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')
    const resolved = proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')
    expect(proVodCatalog).toHaveLength(800)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(800)
    expect(unresolved.length + resolved.length).toBe(800)
    expect(unresolved.length).toBeLessThanOrEqual(107)
    expect(resolved.length).toBeGreaterThanOrEqual(693)
  })

  it('does not fabricate completed tactical analysis', () => {
    const mappedIds = new Set(entries.map(([vodId]) => vodId))
    const mapped = proVodCatalog.filter((vod) => mappedIds.has(vod.id))
    expect(mapped).toHaveLength(13)
    expect(mapped.every((vod) => vod.analysisStatus === 'review-queued')).toBe(true)
    expect(mapped.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
  })
})
