import type { VisualMoveMedia } from '../types'

type FighterVisualIndex = {
  version: 1
  fighterId: string
  moves: VisualMoveMedia[]
}

const cache = new Map<string, Map<string, VisualMoveMedia>>()
const pending = new Map<string, Promise<Map<string, VisualMoveMedia>>>()

function localIndexUrl(fighterId: string): string {
  return `${import.meta.env.BASE_URL}data/visual-media/${encodeURIComponent(fighterId)}.json`
}

function indexMoves(payload: FighterVisualIndex): Map<string, VisualMoveMedia> {
  return new Map(payload.moves.map((media) => [media.moveId, media] as const))
}

export async function loadVisualMediaForFighter(fighterId: string): Promise<Map<string, VisualMoveMedia>> {
  const existing = cache.get(fighterId)
  if (existing) return existing
  const inFlight = pending.get(fighterId)
  if (inFlight) return inFlight

  const request = fetch(localIndexUrl(fighterId), { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`visual media ${response.status}`)
      const payload = await response.json() as FighterVisualIndex
      if (payload.version !== 1 || payload.fighterId !== fighterId || !Array.isArray(payload.moves)) {
        throw new Error(`invalid visual media index for ${fighterId}`)
      }
      const indexed = indexMoves(payload)
      cache.set(fighterId, indexed)
      return indexed
    })
    .finally(() => pending.delete(fighterId))

  pending.set(fighterId, request)
  return request
}

export async function getVisualMoveMedia(fighterId: string, moveId: string): Promise<VisualMoveMedia | undefined> {
  return (await loadVisualMediaForFighter(fighterId)).get(moveId)
}
