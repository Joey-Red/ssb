import { describe, expect, it } from 'vitest'
import { proCoverageGapRepresentatives, proPlayerRepresentatives } from './proLabRosterAll'
import { getProVodsForFighter, proCoverageGapVodCatalog, proVodCatalog } from './proLabVodsAll'

describe('roster-neutral Pro Lab coverage gaps', () => {
  it('closes the discovered Link zero-VOD gap with provenance-backed legacy evidence', () => {
    const representative = proCoverageGapRepresentatives.find((entry) => entry.id === 't-link')
    expect(representative).toMatchObject({
      tag: 'T',
      status: 'legacy',
      characterRoles: [{ fighterId: 'link', role: 'main' }],
    })
    expect(representative?.sourceUrls.length).toBeGreaterThanOrEqual(2)
    expect(proPlayerRepresentatives.some((entry) => entry.id === 't-link')).toBe(true)

    const linkVods = getProVodsForFighter('link')
    expect(linkVods.length).toBeGreaterThan(0)
    expect(linkVods.some((vod) => vod.id === 'umebura-sp4-t-link-zackray')).toBe(true)
  })

  it('keeps coverage-gap footage direct, source-backed, and review-queued', () => {
    expect(proCoverageGapVodCatalog).toHaveLength(1)
    const vod = proCoverageGapVodCatalog[0]!
    expect(vod).toMatchObject({
      playerId: 't-link',
      playerFighterIds: ['link'],
      opponentTag: 'Zackray',
      opponentFighterIds: ['joker'],
      event: 'Umebura SP4',
      eventTier: 'major',
      date: '2019-08-17',
      videoProvider: 'youtube',
      videoId: 'KSfwiboZjaw',
      linkKind: 'direct-video',
      result: 'T 2-0 Zackray',
      analysisStatus: 'review-queued',
    })
    expect(vod.sourceUrls.length).toBeGreaterThanOrEqual(3)
    expect(vod.quality.visibleGameplay).toBe(true)
    expect(vod.quality.score).toBeGreaterThanOrEqual(12)
    expect(proVodCatalog.some((entry) => entry.id === vod.id)).toBe(true)
  })
})
