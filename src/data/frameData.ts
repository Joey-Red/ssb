import type { FighterFrameData, FrameDataSnapshot } from '../types'
import { fighterById } from './roster'

export interface FrameDataIndex {
  snapshot: FrameDataSnapshot
  byFighterId: ReadonlyMap<string, FighterFrameData>
  moveCount: number
}

export function indexFrameData(snapshot: FrameDataSnapshot): FrameDataIndex {
  const byFighterId = new Map<string, FighterFrameData>(
    Object.entries(snapshot.fighters).map(([fighterId, data]) => [
      fighterId,
      { ...data, name: fighterById.get(fighterId)?.name ?? data.name },
    ]),
  )
  const moveCount = [...byFighterId.values()].reduce((total, fighter) => total + fighter.moves.length, 0)
  return { snapshot, byFighterId, moveCount }
}

let cachedIndex: Promise<FrameDataIndex> | null = null

export function frameDataAssetUrl(): string {
  return `${import.meta.env.BASE_URL}data/frameData.generated.json`
}

export function loadFrameDataIndex(): Promise<FrameDataIndex> {
  if (cachedIndex) return cachedIndex

  cachedIndex = fetch(frameDataAssetUrl(), { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Frame-data request failed (${response.status})`)
      const snapshot = await response.json() as FrameDataSnapshot
      return indexFrameData(snapshot)
    })
    .catch((error) => {
      cachedIndex = null
      throw error
    })

  return cachedIndex
}
