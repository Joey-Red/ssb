import { describe, expect, it } from 'vitest'
import { proVodYoutubeResolutionsBulk11 } from './proLabVodLinkResolutionsBulk11'
import { proVodLinkResolutionQueue } from './proLabReviewQueueAll'
import { proVodCatalog } from './proLabVodsAll'

const entries = Object.entries(proVodYoutubeResolutionsBulk11)
const catalogById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

describe('Pro Lab final source-index recovery batch', () => {
  it('contains all 69 remaining source-index mappings', () => {
    expect(entries).toHaveLength(69)
    expect(new Set(entries.map(([vodId]) => vodId)).size).toBe(69)
    for (const [vodId, youtubeId] of entries) {
      expect(catalogById.has(vodId), vodId).toBe(true)
      expect(youtubeId, vodId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('promotes every final mapping to direct review-queued footage', () => {
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

  it('finishes the complete 800-record catalog with zero source indexes', () => {
    expect(proVodCatalog).toHaveLength(800)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(800)
    expect(proVodCatalog.filter((vod) => vod.linkKind === 'source-index')).toHaveLength(0)
    expect(proVodCatalog.filter((vod) => vod.linkKind !== 'source-index')).toHaveLength(800)
  })

  it('corrects fighter metadata contradicted by the recovered source VODs', () => {
    for (const vodId of ['hist6-037', 'hist6-038']) {
      const vod = catalogById.get(vodId)
      expect(vod?.playerFighterIds, vodId).toEqual(['mr-game-and-watch'])
      expect(vod?.opponentFighterIds, vodId).toEqual(['ridley'])
    }

    const shutonZomba = catalogById.get('final293-b-070')
    expect(shutonZomba?.playerFighterIds).toEqual(['pyra', 'mythra'])
    expect(shutonZomba?.opponentFighterIds).toEqual(['rob'])
  })

  it('does not infer tactical review completion from link recovery', () => {
    const mappedIds = new Set(entries.map(([vodId]) => vodId))
    const mapped = proVodCatalog.filter((vod) => mappedIds.has(vod.id))
    expect(mapped).toHaveLength(69)
    expect(mapped.every((vod) => vod.analysisStatus === 'review-queued')).toBe(true)
    expect(mapped.some((vod) => vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed')).toBe(false)
  })
})
