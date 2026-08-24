import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { visualMoveMedia } from './visualMedia'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import type { FrameDataSnapshot } from '../types'

const index = indexFrameData(snapshotJson as unknown as FrameDataSnapshot)

describe('visual-media timing consistency', () => {
  it('keeps every discovered visual reference attached to a committed move row', () => {
    for (const media of visualMoveMedia) {
      const fighter = index.byFighterId.get(media.fighterId)
      expect(fighter, media.fighterId).toBeDefined()
      const move = fighter?.moves.find((candidate) => candidate.id === media.moveId)
      expect(move, `${media.fighterId}/${media.moveId}`).toBeDefined()
      if (!move) continue

      const total = numericValue(move.totalFrames)
      if (total !== null) expect(media.totalFrames, `${media.id} total`).toBe(total)

      const expectedStart = firstFrame(move.active)
      const expectedEnd = lastFrame(move.active)
      for (const variant of media.variants ?? []) {
        const numbers = variant.spriteSheet?.frameNumbers
        if (!numbers?.length) continue
        if (expectedStart !== null) expect(numbers[0], `${media.id}/${variant.id} visual start`).toBeGreaterThanOrEqual(expectedStart)
        if (expectedEnd !== null) expect(numbers.at(-1), `${media.id}/${variant.id} visual end`).toBeLessThanOrEqual(expectedEnd)
      }
    }
  })
})
