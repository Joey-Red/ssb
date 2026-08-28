import { describe, expect, it } from 'vitest'
import { proCoverageGapRepresentatives, proPlayerRepresentatives } from './proLabRosterAll'
import {
  getProVodsForFighter,
  proCoverageGapVodCatalog,
  proVodCatalog,
  proVodCatalogWithCoverageGaps,
} from './proLabVodsAll'

describe('roster-neutral Pro Lab coverage gaps', () => {
  it('adds provenance-backed representatives only for objectively discovered gaps', () => {
    const expectedRepresentativeIds = [
      't-link',
      'toriguri',
      'tsumusuto',
      'bassmage',
      'regalo',
      'dabuz',
    ]

    expect(proCoverageGapRepresentatives.map((entry) => entry.id)).toEqual(expectedRepresentativeIds)
    for (const representative of proCoverageGapRepresentatives) {
      expect(representative.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(proPlayerRepresentatives.some((entry) => entry.id === representative.id)).toBe(true)
    }
  })

  it('keeps gap-fill footage direct, source-backed, review-queued, and outside the frozen acquisition baseline', () => {
    expect(proCoverageGapVodCatalog).toHaveLength(6)
    expect(proVodCatalog).toHaveLength(800)
    expect(proVodCatalogWithCoverageGaps).toHaveLength(806)

    expect(proCoverageGapVodCatalog.map((vod) => vod.id)).toEqual([
      'umebura-sp4-t-link-zackray',
      'winner-period-toriguri-protobanham',
      'maesumatop9-tsumusuto-shirayuki-wsf',
      'ufa2023-bassmage-mkleo',
      'ssc2022-regalo-dabuz-top12',
      'ssc2022-dabuz-light-lq',
    ])

    for (const vod of proCoverageGapVodCatalog) {
      expect(vod.linkKind).toBe('direct-video')
      expect(vod.videoProvider).toBe('youtube')
      expect(vod.videoId).toBeTruthy()
      expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(vod.quality.visibleGameplay).toBe(true)
      expect(vod.quality.score).toBeGreaterThanOrEqual(12)
      expect(vod.analysisStatus).toBe('review-queued')
      expect(proVodCatalog.some((entry) => entry.id === vod.id)).toBe(false)
      expect(proVodCatalogWithCoverageGaps.some((entry) => entry.id === vod.id)).toBe(true)
    }
  })

  it('closes six neutral zero-VOD fighter gaps without promoting tactical evidence', () => {
    const closedFighterIds = [
      'link',
      'banjo-and-kazooie',
      'dr-mario',
      'jigglypuff',
      'lucas',
      'rosalina-and-luma',
    ]

    for (const fighterId of closedFighterIds) {
      expect(getProVodsForFighter(fighterId).length, fighterId).toBeGreaterThan(0)
    }
  })
})
