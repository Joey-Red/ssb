import snapshotJson from './frameData.generated.json'
import type { FighterFrameData, FrameDataSnapshot } from '../types'
import { fighterById } from './roster'

export const frameDataSnapshot = snapshotJson as unknown as FrameDataSnapshot

export const frameDataByFighterId = new Map<string, FighterFrameData>(
  Object.entries(frameDataSnapshot.fighters).map(([fighterId, data]) => [
    fighterId,
    { ...data, name: fighterById.get(fighterId)?.name ?? data.name },
  ]),
)

export const frameMoveCount = [...frameDataByFighterId.values()]
  .reduce((total, fighter) => total + fighter.moves.length, 0)
