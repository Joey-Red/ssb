import snapshotJson from './frameData.generated.json'
import type { FighterFrameData, FrameDataSnapshot } from '../types'

export const frameDataSnapshot = snapshotJson as unknown as FrameDataSnapshot

export const frameDataByFighterId = new Map<string, FighterFrameData>(
  Object.entries(frameDataSnapshot.fighters),
)

export const frameMoveCount = Object.values(frameDataSnapshot.fighters)
  .reduce((total, fighter) => total + fighter.moves.length, 0)
