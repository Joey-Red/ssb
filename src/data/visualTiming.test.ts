import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { visualMoveMedia } from './visualMedia'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import type { FrameDataSnapshot } from '../types'

const index = indexFrameData(snapshotJson as unknown as FrameDataSnapshot)

describe('visual-media timing consistency', () => {
  it('keeps registered visual references aligned to the committed move timing', () => {
    for (const media of visualMoveMedia) {
      const fighter = index.byFighterId.get(media.fighterId)
      expect(fighter, media.fighterId).toBeDefined()
      const move = fighter?.moves.find((candidate) => candidate.id === media.moveId)
      expect(move, `${media.fighterId}/${media.moveId}`).toBeDefined()
      if (!move) continue

      const total = numericValue(move.totalFrames)
      if (total !== null) expect(media.totalFrames, `${media.id} total`).toBe(total)

      const activeFrames = media.frames.filter((frame) => frame.phase === 'active').map((frame) => frame.frame)
      const expectedStart = firstFrame(move.active)
      const expectedEnd = lastFrame(move.active)
      if (expectedStart !== null) expect(activeFrames[0], `${media.id} active start`).toBe(expectedStart)
      if (expectedEnd !== null) expect(activeFrames.at(-1), `${media.id} active end`).toBe(expectedEnd)
    }
  })
})
