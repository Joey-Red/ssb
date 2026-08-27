import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk4 } from './proLabVodLinkResolutionsBulk4'
import { proVodLinkResolutionQueue } from './proLabReviewQueueAll'
import { proVodCatalog } from './proLabVodsAll'

describe('Pro Lab bulk VOD link recovery 4', () => {
  const resolutions = Object.entries(proVodYoutubeResolutionsBulk4)

  it('ships exactly 151 evidence-backed direct YouTube mappings', () => {
    expect(resolutions).toHaveLength(151)
    expect(new Set(resolutions.map(([, youtubeId]) => youtubeId)).size).toBe(148)
    for (const [vodId, youtubeId] of resolutions) {
      expect(vodId.length).toBeGreaterThan(0)
      expect(youtubeId, vodId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('applies every mapping to an existing catalog record without fabricating review completion', () => {
    for (const [vodId, youtubeId] of resolutions) {
      const vod = proVodCatalog.find((entry) => entry.id === vodId)
      expect(vod, vodId).toBeTruthy()
      expect(vod?.linkKind, vodId).toBe('direct-video')
      expect(vod?.videoProvider, vodId).toBe('youtube')
      expect(vod?.videoId, vodId).toBe(youtubeId)
      expect(vod?.videoUrl, vodId).toBe(`https://www.youtube.com/watch?v=${youtubeId}`)
      expect(vod?.analysisStatus, vodId).toBe('review-queued')
      expect(vod?.quality.visibleGameplay, vodId).toBe(true)
      expect(proVodLinkResolutionQueue.some((entry) => entry.id === vodId), vodId).toBe(false)
    }
  })

  it('keeps the complete catalog internally consistent after later verified recovery batches', () => {
    const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')
    const resolved = proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')
    expect(proVodCatalog).toHaveLength(800)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(800)
    expect(unresolved.length + resolved.length).toBe(800)
    expect(unresolved.length).toBeLessThanOrEqual(120)
    expect(resolved.length).toBeGreaterThanOrEqual(680)
    expect(proVodCatalog.filter((vod) => vod.linkKind === 'direct-video').length).toBeGreaterThanOrEqual(623)
  })

  it('keeps tactical claims pending even after direct footage recovery', () => {
    const mappedIds = new Set(resolutions.map(([vodId]) => vodId))
    const mapped = proVodCatalog.filter((vod) => mappedIds.has(vod.id))
    expect(mapped).toHaveLength(151)
    expect(mapped.every((vod) => vod.analysisStatus === 'review-queued')).toBe(true)
    expect(mapped.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
  })
})