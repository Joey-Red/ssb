import { supplementalProVodCatalog } from './proLabVodsSupplemental'
import { proVodCatalog as foundationalProVodCatalog } from './proLabVods'
import type { ProVodRecord } from './proLabTypes'

export const proVodCatalog = [
  ...foundationalProVodCatalog,
  ...supplementalProVodCatalog,
] as readonly ProVodRecord[]

export const proVodById = new Map(proVodCatalog.map((vod) => [vod.id, vod]))

export function getProVodsForFighter(fighterId: string) {
  return proVodCatalog.filter((vod) => vod.playerFighterIds.includes(fighterId))
}

export function getProVodsForPlayer(playerId: string) {
  return proVodCatalog.filter((vod) => vod.playerId === playerId)
}

export { supplementalProVodCatalog }
