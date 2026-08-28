import { describe, expect, it } from 'vitest'
import { proFighterResearchRegistry, proRosterCoverage, proVodCatalog } from './proLab'
import { proPlayerRepresentatives } from './proLabRosterAll'

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')

describe('temporary M73 inventory', () => {
  it('reports severe fighter representatives and existing opponent pairings', () => {
    const severe = proRosterCoverage.filter((entry) => entry.vodCount < 6)
    const playerById = new Map(proPlayerRepresentatives.map((player) => [player.id, player]))
    const rows = severe.map((entry) => {
      const research = proFighterResearchRegistry.find((item) => item.fighterId === entry.fighterId)
      const representatives = (research?.representativeIds ?? []).map((id) => playerById.get(id)).filter(Boolean)
      const tags = representatives.map((player) => player?.tag ?? '').filter(Boolean)
      const tagKeys = new Set(tags.map(normalize))
      const opponentPairings = proVodCatalog
        .filter((vod) => tagKeys.has(normalize(vod.opponentTag)))
        .map((vod) => ({ id: vod.id, primaryPlayerId: vod.playerId, opponentTag: vod.opponentTag, date: vod.date, event: vod.event, linkKind: vod.linkKind, videoUrl: vod.videoUrl }))
      return {
        fighterId: entry.fighterId,
        vodCount: entry.vodCount,
        currentVodCount: entry.currentVodCount,
        representatives: representatives.map((player) => player && ({ id: player.id, tag: player.tag, status: player.status, roles: player.characterRoles })),
        opponentPairings,
      }
    })
    console.log(`M73_INVENTORY=${JSON.stringify(rows)}`)
    expect(rows.length).toBeGreaterThan(0)
  })
})
