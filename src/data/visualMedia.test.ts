import { describe, expect, it } from 'vitest'
import { visualMoveMedia } from './visualMedia'

function validateVisualMedia(): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const keys = new Set<string>()

  for (const media of visualMoveMedia) {
    if (ids.has(media.id)) errors.push(`duplicate media id ${media.id}`)
    ids.add(media.id)
    const key = `${media.fighterId}:${media.moveId}`
    if (keys.has(key)) errors.push(`duplicate fighter/move visual ${key}`)
    keys.add(key)
    if (!media.sourceUrl.startsWith('https://')) errors.push(`${media.id}: source must be https`)
    if (media.animatedPreviewUrl && !media.animatedPreviewUrl.startsWith('https://')) errors.push(`${media.id}: preview must be https`)
    if (media.frames.length !== media.totalFrames) errors.push(`${media.id}: expected ${media.totalFrames} frame rows, found ${media.frames.length}`)
    media.frames.forEach((frame, index) => {
      if (frame.frame !== index + 1) errors.push(`${media.id}: frame numbering is not contiguous at ${index + 1}`)
      if ((frame.regions?.length ?? 0) > 0 && !frame.imageSrc) errors.push(`${media.id}: frame ${frame.frame} has overlay geometry without an exact still image`)
      for (const region of frame.regions ?? []) {
        if (region.x < 0 || region.x > 100 || region.y < 0 || region.y > 100) errors.push(`${media.id}: ${region.id} is outside the image`)
        if (region.radius <= 0 || region.radius > 50) errors.push(`${media.id}: ${region.id} has invalid radius`)
      }
    })
  }
  return errors
}

describe('visual frame media', () => {
  it('keeps frame sequences contiguous and overlay-safe', () => expect(validateVisualMedia()).toEqual([]))

  it('uses real UFD animated references for every registered preview', () => {
    expect(visualMoveMedia.length).toBeGreaterThanOrEqual(19)
    expect(visualMoveMedia.every((media) => media.animatedPreviewUrl?.includes('ultimateframedata.com/hitboxes/'))).toBe(true)
  })

  it('covers all five Pyra and Mythra aerials', () => {
    const aerials = ['neutral-air', 'forward-air', 'back-air', 'up-air', 'down-air']
    for (const fighterId of ['pyra', 'mythra']) {
      const covered = new Set(visualMoveMedia.filter((media) => media.fighterId === fighterId).map((media) => media.moveId))
      expect(aerials.every((moveId) => covered.has(moveId)), fighterId).toBe(true)
    }
  })
})
