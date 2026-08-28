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
      'rickles',
      'zaki',
      'wadi',
      'capitancito',
      'trigger-simon',
    ]

    expect(proCoverageGapRepresentatives.map((entry) => entry.id)).toEqual(expectedRepresentativeIds)
    for (const representative of proCoverageGapRepresentatives) {
      expect(representative.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(proPlayerRepresentatives.some((entry) => entry.id === representative.id)).toBe(true)
    }
  })

  it('keeps gap-fill footage direct, source-backed, review-queued, and outside the frozen acquisition baseline', () => {
    expect(proCoverageGapVodCatalog).toHaveLength(19)
    expect(proVodCatalog).toHaveLength(800)
    expect(proVodCatalogWithCoverageGaps).toHaveLength(819)

    expect(proCoverageGapVodCatalog.map((vod) => vod.id)).toEqual([
      'umebura-sp4-t-link-zackray',
      'winner-period-toriguri-protobanham',
      'maesumatop9-tsumusuto-shirayuki-wsf',
      'ufa2023-bassmage-mkleo',
      'ssc2022-regalo-dabuz-top12',
      'ssc2022-dabuz-light-lq',
      'nyxl-tweek-light-wsf',
      'seibugeki13-miya-earth',
      'frostbite2020-rickles-charliedaking-pools',
      'tamisuma174-hero-zaki-r4',
      'tamisuma189-hero-elizabeth-qf',
      'maesumatop13-protobanham-doramigi',
      'gimvitational-tweek-mkleo-wf',
      'glitch85-wadi-marss-top12',
      'momocon2022-ddee-capitancito',
      'dabuz-johnnumbers-miiswordfighter',
      'eight-nietono-hero-wf',
      'n2-zackray-shuton-lf',
      'kagaribi11-hero-nano',
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

  it('closes every verified zero-VOD fighter gap while leaving Simon explicitly unresolved', () => {
    const closedFighterIds = [
      'link',
      'banjo-and-kazooie',
      'dr-mario',
      'jigglypuff',
      'lucas',
      'rosalina-and-luma',
      'chrom',
      'dark-pit',
      'ganondorf',
      'king-dedede',
      'lucario',
      'lucina',
      'marth',
      'mewtwo',
      'mii-gunner',
      'mii-swordfighter',
      'pichu',
      'pit',
      'zelda',
    ]

    for (const fighterId of closedFighterIds) {
      expect(getProVodsForFighter(fighterId).length, fighterId).toBeGreaterThan(0)
    }

    expect(getProVodsForFighter('simon')).toHaveLength(0)
    expect(proCoverageGapRepresentatives.some((entry) =>
      entry.id === 'trigger-simon' && entry.characterRoles.some((role) => role.fighterId === 'simon'),
    )).toBe(true)
  })
})
