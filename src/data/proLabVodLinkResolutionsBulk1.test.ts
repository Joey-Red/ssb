import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk1 } from './proLabVodLinkResolutionsBulk1'
import { proVodCatalog } from './proLabVodsAll'

const resolutionEntries = Object.entries(proVodYoutubeResolutionsBulk1)
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab bulk direct-link resolution', () => {
  it('preserves the 800-record corpus while upgrading 41 verified links', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(resolutionEntries).toHaveLength(41)
    for (const [vodId] of resolutionEntries) expect(catalogById.has(vodId), vodId).toBe(true)
  })

  it('permits only the known reversed-orientation duplicate target', () => {
    const byYoutubeId = new Map<string, string[]>()
    for (const [vodId, youtubeId] of resolutionEntries) {
      const ids = byYoutubeId.get(youtubeId) ?? []
      ids.push(vodId)
      byYoutubeId.set(youtubeId, ids)
    }
    const duplicates = [...byYoutubeId.entries()].filter(([, vodIds]) => vodIds.length > 1)
    expect(duplicates).toEqual([['9L2FcAe0LIk', ['hist6-253', 'final293-b-028']]])
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
    expect(unresolved).toHaveLength(687)
    expect(direct).toHaveLength(113)
  })
})
