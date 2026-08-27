import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk1 } from './proLabVodLinkResolutionsBulk1'
import { proVodCatalog } from './proLabVodsAll'

const resolutionEntries = Object.entries(proVodYoutubeResolutionsBulk1)
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab bulk direct-link resolution', () => {
  it('preserves the 800-set corpus while upgrading only known records', () => {
    expect(proVodCatalog).toHaveLength(800)
    for (const [vodId] of resolutionEntries) expect(catalogById.has(vodId), vodId).toBe(true)
  })

  it('uses unique YouTube targets for independently indexed set records', () => {
    const youtubeIds = resolutionEntries.map(([, youtubeId]) => youtubeId)
    expect(new Set(youtubeIds).size).toBe(youtubeIds.length)
  })

  it('promotes resolved records to direct watch without inventing tactical review or patch state', () => {
    for (const [vodId, youtubeId] of resolutionEntries) {
      const vod = catalogById.get(vodId)
      expect(vod, vodId).toBeDefined()
      expect(vod?.linkKind, vodId).toBe('direct-video')
      expect(vod?.videoProvider, vodId).toBe('youtube')
      expect(vod?.videoId, vodId).toBe(youtubeId)
      expect(vod?.videoUrl, vodId).toBe(`https://www.youtube.com/watch?v=${youtubeId}`)
      expect(vod?.analysisStatus, vodId).toBe('review-queued')
      expect(vod?.quality.visibleGameplay, vodId).toBe(true)
      expect(vod?.quality.patchKnown, vodId).toBe(false)
      expect(vod?.result, vodId).toBeUndefined()
    }
  })

  it('keeps catalog states internally consistent', () => {
    const direct = proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')
    const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')
    expect(direct.length + unresolved.length).toBe(800)
    expect(direct.length).toBeGreaterThanOrEqual(72 + resolutionEntries.length)
  })
})
