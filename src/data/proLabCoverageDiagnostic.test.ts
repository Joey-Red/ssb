import { describe, it } from 'vitest'
import { proFighterResearchRegistry, proTemporalEvidence, proVodCatalog } from './proLab'
import { proVodAcquisitionIdentity, proVodFinal293Candidates } from './proLabVodsFinal293'
import { roster } from './roster'

describe('temporary Pro Lab milestone coverage diagnostic', () => {
  it('reports vetted expansion inventory for M73-M76 planning', () => {
    const temporalByVod = new Map(proTemporalEvidence.map((entry) => [entry.vodId, entry]))
    const liveIdentities = new Set(proVodCatalog.map(proVodAcquisitionIdentity))
    const rows = roster.map((fighter) => {
      const primary = proVodCatalog.filter((vod) => vod.playerFighterIds.includes(fighter.id))
      const anySide = proVodCatalog.filter((vod) =>
        vod.playerFighterIds.includes(fighter.id) || vod.opponentFighterIds.includes(fighter.id),
      )
      const research = proFighterResearchRegistry.find((entry) => entry.fighterId === fighter.id)
      return {
        fighterId: fighter.id,
        primaryVodCount: primary.length,
        anySideVodCount: anySide.length,
        currentAnySideVodCount: anySide.filter((vod) => temporalByVod.get(vod.id)?.era === 'current').length,
        representativeIds: research?.representativeIds ?? [],
      }
    })
    const unusedCandidates = proVodFinal293Candidates
      .filter((vod) => !liveIdentities.has(proVodAcquisitionIdentity(vod)))
      .map((vod) => ({
        id: vod.id,
        playerId: vod.playerId,
        fighterIds: vod.playerFighterIds,
        opponentTag: vod.opponentTag,
        event: vod.event,
        date: vod.date,
        videoUrl: vod.videoUrl,
        sourceUrls: vod.sourceUrls,
      }))
    throw new Error(`PROLAB_EXPANSION_INVENTORY ${JSON.stringify({
      repGaps: rows.filter((item) => item.representativeIds.length < 2),
      severePrimary: rows.filter((item) => item.primaryVodCount < 6),
      belowPrimaryFloor: rows.filter((item) => item.primaryVodCount < 12),
      belowCurrentAllSideFloor: rows.filter((item) => item.currentAnySideVodCount < 4),
      unusedCandidates,
    })}`)
  })
})
