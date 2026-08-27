import { describe, expect, it } from 'vitest'
import { isCatalogQuality } from '../lib/proLab'
import { roster } from './roster'
import { proVodYoutubeResolutions2026Batch5 } from './proLabVodLinkResolutions2026Batch5'
import { proVodYoutubeResolutionsBulk2 } from './proLabVodLinkResolutionsBulk2'
import { proVodYoutubeResolutionsBulk3 } from './proLabVodLinkResolutionsBulk3'
import { proVodLinkResolutionQueue, proVodLinkResolutionQueueStats, proVodReviewQueue } from './proLabReviewQueueAll'
import { proPlayerRepresentatives, proFighterResearchRegistry } from './proLabRosterAll'
import { proPlayerRepresentatives2026Batch4 } from './proLabRoster2026Batch4'
import {
  proVodCatalog2026Batch4,
  proVodCatalog2026Comicpalooza,
  proVodCatalog2026Patchwork,
  proVodCatalog2026SFactor,
  proVodCatalog2026Supernova,
} from './proLabVods2026Batch4'
import { getProVodsForFighter, proVodCatalog } from './proLabVodsAll'

describe('Pro Lab bulk VOD acquisition batch 4', () => {
  const rosterIds = new Set<string>(roster.map((fighter) => fighter.id))
  const playerIds = new Set(proPlayerRepresentatives.map((player) => player.id))

  it('adds 89 source-indexed 2026 tournament sets in one acquisition pass', () => {
    expect(proVodCatalog2026Patchwork).toHaveLength(42)
    expect(proVodCatalog2026SFactor).toHaveLength(25)
    expect(proVodCatalog2026Comicpalooza).toHaveLength(14)
    expect(proVodCatalog2026Supernova).toHaveLength(8)
    expect(proVodCatalog2026Batch4).toHaveLength(89)
    expect(proVodCatalog.length).toBeGreaterThanOrEqual(146)
    expect(proVodCatalog.filter((vod) => vod.date.startsWith('2026-')).length).toBeGreaterThanOrEqual(136)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(proVodCatalog.length)
  })

  it('keeps every original bulk acquisition record honestly source-indexed at ingestion', () => {
    for (const vod of proVodCatalog2026Batch4) {
      expect(playerIds.has(vod.playerId), vod.id).toBe(true)
      expect(vod.linkKind).toBe('source-index')
      expect(vod.videoProvider).toBe('other')
      expect(vod.videoId).toBeUndefined()
      expect(vod.datePrecision).toBe('event-anchor')
      expect(vod.analysisStatus).toBe('cataloged')
      expect(vod.videoUrl).toContain('smash-tube.com')
      expect(vod.sourceUrls).toHaveLength(2)
      expect(vod.sourceUrls[0]).toBe(vod.videoUrl)
      expect(vod.quality.visibleGameplay).toBe(false)
      expect(vod.quality.officialOrTournamentChannel).toBe(false)
      expect(vod.quality.patchKnown).toBe(false)
      expect(isCatalogQuality(vod.quality)).toBe(true)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
      expect(vod.opponentFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
    }
  })

  it('adds nine provenance-backed representatives for the widened corpus', () => {
    expect(proPlayerRepresentatives2026Batch4).toHaveLength(9)
    expect(proPlayerRepresentatives.length).toBeGreaterThanOrEqual(61)
    expect(new Set(proPlayerRepresentatives.map((player) => player.id)).size).toBe(proPlayerRepresentatives.length)

    for (const player of proPlayerRepresentatives2026Batch4) {
      expect(player.sourceUrls.length).toBeGreaterThanOrEqual(2)
      expect(player.characterRoles.length).toBeGreaterThan(0)
      for (const role of player.characterRoles) {
        expect(rosterIds.has(role.fighterId), `${player.id}:${role.fighterId}`).toBe(true)
        expect(proFighterResearchRegistry.find((entry) => entry.fighterId === role.fighterId)?.representativeIds).toContain(player.id)
      }
    }
  })

  it('widens previously thin fighter libraries instead of only padding the deepest characters', () => {
    const widened: readonly string[] = [
      'shulk',
      'wii-fit-trainer',
      'richter',
      'king-k-rool',
      'palutena',
      'bayonetta',
      'luigi',
      'villager',
      'toon-link',
      'sheik',
      'daisy',
      'inkling',
      'captain-falcon',
      'terry',
    ]
    const batch4Ids = new Set<string>(proVodCatalog2026Batch4.map((vod) => vod.id))
    for (const fighterId of widened) {
      expect(getProVodsForFighter(fighterId).some((vod) => batch4Ids.has(vod.id)), fighterId).toBe(true)
    }
  })

  it('keeps unresolved batch 4 records in link resolution while resolved records advance to direct review', () => {
    const batch4Ids = new Set(proVodCatalog2026Batch4.map((vod) => vod.id))
    const resolvedIds = new Set<string>([
      ...Object.keys(proVodYoutubeResolutions2026Batch5),
      ...Object.keys(proVodYoutubeResolutionsBulk2),
      ...Object.keys(proVodYoutubeResolutionsBulk3),
    ].filter((id) => batch4Ids.has(id)))
    expect(resolvedIds.size).toBeGreaterThan(5)
    expect(proVodLinkResolutionQueueStats.total).toBeGreaterThan(0)
    expect(proVodLinkResolutionQueueStats.currentSeason).toBeGreaterThan(0)

    for (const vod of proVodCatalog2026Batch4) {
      const isResolved = resolvedIds.has(vod.id)
      expect(proVodLinkResolutionQueue.some((entry) => entry.id === vod.id), vod.id).toBe(!isResolved)
      if (isResolved) {
        const resolvedVod = proVodCatalog.find((entry) => entry.id === vod.id)
        expect(resolvedVod?.linkKind, vod.id).toBe('direct-video')
        expect(proVodReviewQueue.some((target) => target.videoUrl === resolvedVod?.videoUrl), vod.id).toBe(true)
      } else {
        expect(proVodReviewQueue.some((target) => target.vodId === vod.id), vod.id).toBe(false)
      }
    }
  })
})