import { proVodCatalog2026Batch1 } from './proLabVods2026Batch1'
import { supplementalProVodCatalog } from './proLabVodsSupplemental'
import { proVodCatalog as foundationalProVodCatalog } from './proLabVods'
import type { ProVodRecord } from './proLabTypes'

export const proVodCatalog = [
  ...foundationalProVodCatalog,
  ...supplementalProVodCatalog,
  ...proVodCatalog2026Batch1,
] as readonly ProVodRecord[]

export const proVodById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

export function vodIncludesFighter(vod: ProVodRecord, fighterId: string) {
  return vod.playerFighterIds.includes(fighterId) || vod.opponentFighterIds.includes(fighterId)
}

export function getProVodsForFighter(fighterId: string) {
  return proVodCatalog.filter((vod) => vodIncludesFighter(vod, fighterId))
}

export function getProVodsForPlayer(playerId: string) {
  return proVodCatalog.filter((vod) => vod.playerId === playerId)
}

export { proVodCatalog2026Batch1, supplementalProVodCatalog }
