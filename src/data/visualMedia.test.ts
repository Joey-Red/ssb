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
  it('ships real animated references for the initial visual set', () => {
    expect(visualMoveMedia.length).toBeGreaterThanOrEqual(3)
    expect(visualMoveMedia.every((media) => media.animatedPreviewUrl?.includes('ultimateframedata.com/hitboxes/'))).toBe(true)
  })
})
