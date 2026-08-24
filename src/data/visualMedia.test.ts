import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { visualMoveMedia } from './visualMedia'

function publicFile(src: string): string {
  return join(process.cwd(), 'public', src.replace(/^\/+/, ''))
}

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
    if (!media.sourceUrl.startsWith('https://')) errors.push(`${media.id}: source documentation must be https`)
    if (!media.animatedPreviewUrl || /^https?:\/\//.test(media.animatedPreviewUrl)) errors.push(`${media.id}: preview must be a local static asset`)
    if (!media.spriteSheet) errors.push(`${media.id}: exact frame sheet is required`)
    if (media.spriteSheet) {
      if (/^https?:\/\//.test(media.spriteSheet.src)) errors.push(`${media.id}: exact frame sheet must be local`)
      if (media.spriteSheet.frameWidth < 1 || media.spriteSheet.frameHeight < 1) errors.push(`${media.id}: invalid frame-sheet dimensions`)
      if (media.spriteSheet.columns < 1) errors.push(`${media.id}: frame-sheet columns must be positive`)
    }
    if (media.frames.length !== media.totalFrames) errors.push(`${media.id}: expected ${media.totalFrames} frame rows, found ${media.frames.length}`)
    media.frames.forEach((frame, index) => {
      if (frame.frame !== index + 1) errors.push(`${media.id}: frame numbering is not contiguous at ${index + 1}`)
      const hasExactFrameImage = Boolean(frame.imageSrc || media.spriteSheet)
      if ((frame.regions?.length ?? 0) > 0 && !hasExactFrameImage) errors.push(`${media.id}: frame ${frame.frame} has overlay geometry without an exact frame image`)
      for (const region of frame.regions ?? []) {
        if (region.x < 0 || region.x > 100 || region.y < 0 || region.y > 100) errors.push(`${media.id}: ${region.id} is outside the image`)
        if (region.radius <= 0 || region.radius > 50) errors.push(`${media.id}: ${region.id} has invalid radius`)
      }
    })
  }
  return errors
}

describe('visual frame media', () => {
  it('keeps frame sequences contiguous, local and overlay-safe', () => expect(validateVisualMedia()).toEqual([]))

  it('ships exact local preview and sprite assets for every registered move', () => {
    expect(visualMoveMedia).toHaveLength(19)
    for (const media of visualMoveMedia) {
      expect(media.animatedPreviewUrl, media.id).toBeTruthy()
      expect(media.spriteSheet, media.id).toBeTruthy()
      expect(existsSync(publicFile(media.animatedPreviewUrl!)), `${media.id} preview`).toBe(true)
      expect(existsSync(publicFile(media.spriteSheet!.src)), `${media.id} sheet`).toBe(true)
    }
  })

  it('covers all five Pyra and Mythra aerials with exact seekable sheets', () => {
    const aerials = ['neutral-air', 'forward-air', 'back-air', 'up-air', 'down-air']
    for (const fighterId of ['pyra', 'mythra']) {
      const fighterMedia = visualMoveMedia.filter((media) => media.fighterId === fighterId)
      const covered = new Set(fighterMedia.map((media) => media.moveId))
      expect(aerials.every((moveId) => covered.has(moveId)), fighterId).toBe(true)
      expect(fighterMedia.every((media) => Boolean(media.spriteSheet)), `${fighterId} exact sheets`).toBe(true)
    }
  })
})
