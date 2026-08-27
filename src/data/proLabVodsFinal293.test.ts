import { describe, expect, it } from 'vitest'
import { isCatalogQuality } from '../lib/proLab'
import { proMaintenanceReport } from './proLab'
import { proVodLinkResolutionQueue, proVodReviewQueue } from './proLabReviewQueueAll'
import { proPlayerRepresentatives } from './proLabRosterAll'
import { roster } from './roster'
import { proVodAcquisitionIdentity, proVodFinal293Candidates } from './proLabVodsFinal293'
import {
  proVodCatalog,
  proVodCatalogBeforeFinal293,
  proVodCatalogFinal293,
} from './proLabVodsAll'

describe('Pro Lab final 293-set acquisition', () => {
  const rosterIds = new Set<string>(roster.map((fighter) => fighter.id))
  const playerIds = new Set<string>(proPlayerRepresentatives.map((player) => player.id))
  const preFinalIdentities = new Set(proVodCatalogBeforeFinal293.map(proVodAcquisitionIdentity))

  it('selects exactly 293 new records and reaches the 800-set acquisition benchmark', () => {
    expect(proVodCatalogBeforeFinal293).toHaveLength(507)
    expect(proVodFinal293Candidates.length).toBeGreaterThanOrEqual(350)
    expect(proVodCatalogFinal293).toHaveLength(293)
    expect(proVodCatalog).toHaveLength(800)
    expect(new Set(proVodCatalog.map((vod) => vod.id)).size).toBe(800)
  })

  it('rejects existing and within-batch player/opponent/date duplicates', () => {
    const selectedIdentities = proVodCatalogFinal293.map(proVodAcquisitionIdentity)
    expect(new Set(selectedIdentities).size).toBe(293)
    expect(selectedIdentities.some((identity) => preFinalIdentities.has(identity))).toBe(false)
  })

  it('keeps every selected record canonical and honestly unresolved at acquisition time', () => {
    for (const vod of proVodCatalogFinal293) {
      expect(playerIds.has(vod.playerId), vod.id).toBe(true)
      expect(vod.playerFighterIds.length, vod.id).toBeGreaterThan(0)
      expect(vod.playerFighterIds.every((fighterId) => rosterIds.has(fighterId)), vod.id).toBe(true)
      expect(vod.opponentFighterIds, vod.id).toHaveLength(0)
      expect(vod.linkKind, vod.id).toBe('source-index')
      expect(vod.analysisStatus, vod.id).toBe('cataloged')
      expect(vod.videoProvider, vod.id).toBe('other')
      expect(vod.gameVersion, vod.id).toBe('unknown')
      expect(vod.datePrecision, vod.id).toBe('event-anchor')
      expect(vod.quality.visibleGameplay, vod.id).toBe(false)
      expect(vod.quality.patchKnown, vod.id).toBe(false)
      expect(vod.quality.officialOrTournamentChannel, vod.id).toBe(false)
      expect(isCatalogQuality(vod.quality), vod.id).toBe(true)
      expect(vod.sourceUrls.length, vod.id).toBeGreaterThanOrEqual(2)
      expect(vod.sourceUrls.every((url) => url.includes('smash-tube.com')), vod.id).toBe(true)
      expect(vod.result, vod.id).toBeUndefined()
    }
  })

  it('routes unresolved final records to link resolution and resolved media to review', () => {
    const finalIds = new Set(proVodCatalogFinal293.map((vod) => vod.id))
    const linkIds = new Set(proVodLinkResolutionQueue.map((vod) => vod.id))
    const reviewIds = new Set(proVodReviewQueue.map((target) => target.vodId).filter(Boolean))
    const reviewMedia = new Set(proVodReviewQueue.map((target) => target.videoUrl))
    const productionById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

    for (const id of finalIds) {
      const productionVod = productionById.get(id)
      expect(productionVod, id).toBeDefined()
      if (productionVod?.linkKind === 'source-index') {
        expect(linkIds.has(id), id).toBe(true)
        expect(reviewIds.has(id), id).toBe(false)
      } else {
        expect(productionVod?.linkKind, id).toBe('direct-video')
        expect(linkIds.has(id), id).toBe(false)
        expect(reviewIds.has(id) || reviewMedia.has(productionVod?.videoUrl ?? ''), id).toBe(true)
      }
    }
  })

  it('adds broad representative and fighter depth without breaking the production audit', () => {
    expect(new Set(proVodCatalogFinal293.map((vod) => vod.playerId)).size).toBeGreaterThanOrEqual(12)
    expect(new Set(proVodCatalogFinal293.flatMap((vod) => vod.playerFighterIds)).size).toBeGreaterThanOrEqual(15)
    expect(proMaintenanceReport.duplicateLearningRecords).toHaveLength(0)
    expect(proMaintenanceReport.malformedUrls).toHaveLength(0)
  })
})
