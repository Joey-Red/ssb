import { describe, it } from 'vitest'
import { proTemporalEvidence, proVodCatalog } from './proLab'
import { roster } from './roster'

describe('temporary Pro Lab milestone coverage diagnostic', () => {
  it('reports all confirmed fighter-side VOD coverage for M73 planning', () => {
    const temporalByVod = new Map(proTemporalEvidence.map((entry) => [entry.vodId, entry]))
    const rows = roster.map((fighter) => {
      const vods = proVodCatalog.filter((vod) =>
        vod.playerFighterIds.includes(fighter.id) || vod.opponentFighterIds.includes(fighter.id),
      )
      return {
        fighterId: fighter.id,
        vodCount: vods.length,
        currentVodCount: vods.filter((vod) => temporalByVod.get(vod.id)?.era === 'current').length,
      }
    })
    const severe = rows.filter((item) => item.vodCount < 6)
    const belowVodFloor = rows.filter((item) => item.vodCount < 12)
    const belowCurrentFloor = rows.filter((item) => item.currentVodCount < 4)
    throw new Error(`PROLAB_M73_ALL_SIDES ${JSON.stringify({
      summary: {
        zeroVodFighterCount: rows.filter((item) => item.vodCount === 0).length,
        severeVodDeficitCount: severe.length,
        vodFloorMetCount: rows.length - belowVodFloor.length,
        currentVodFloorMetCount: rows.length - belowCurrentFloor.length,
        totalVodGap: rows.reduce((total, item) => total + Math.max(0, 12 - item.vodCount), 0),
        totalCurrentVodGap: rows.reduce((total, item) => total + Math.max(0, 4 - item.currentVodCount), 0),
        minimumVodCount: Math.min(...rows.map((item) => item.vodCount)),
      },
      severe,
      belowVodFloor,
      belowCurrentFloor,
    })}`)
  })
})
