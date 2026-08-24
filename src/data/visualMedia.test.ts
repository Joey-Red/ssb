import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roster } from './roster'
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
    if (!media.sourceUrl.startsWith('https://ultimateframedata.com/')) errors.push(`${media.id}: canonical source must be UFD https`)
    if (!media.variants?.length) errors.push(`${media.id}: no local visual variants staged`)

    for (const variant of media.variants ?? []) {
      if (!variant.spriteSheet && !variant.imageSrc) errors.push(`${media.id}/${variant.id}: variant has no local asset`)
      if (variant.imageSrc) {
        if (/^https?:\/\//.test(variant.imageSrc)) errors.push(`${media.id}/${variant.id}: static image must be local`)
        if (!existsSync(publicFile(variant.imageSrc))) errors.push(`${media.id}/${variant.id}: static image missing`)
      }
      const sheet = variant.spriteSheet
      if (!sheet) continue
      if (/^https?:\/\//.test(sheet.src)) errors.push(`${media.id}/${variant.id}: sheet must be local`)
      if (!existsSync(publicFile(sheet.src))) errors.push(`${media.id}/${variant.id}: sheet missing`)
      if (sheet.frameWidth < 1 || sheet.frameHeight < 1 || sheet.columns < 1 || sheet.frameCount < 1) errors.push(`${media.id}/${variant.id}: invalid sheet geometry`)
      if (sheet.frameNumbers) {
        if (sheet.frameNumbers.length !== sheet.frameCount) errors.push(`${media.id}/${variant.id}: frame-number map length mismatch`)
        if (new Set(sheet.frameNumbers).size !== sheet.frameNumbers.length) errors.push(`${media.id}/${variant.id}: duplicate exact frame numbers`)
        if (sheet.frameNumbers.some((frame) => frame < 1 || frame > media.totalFrames)) errors.push(`${media.id}/${variant.id}: exact frame outside documented move length`)
        if (sheet.frameNumbers.some((frame, index) => index > 0 && frame <= sheet.frameNumbers![index - 1]!)) errors.push(`${media.id}/${variant.id}: frame-number map is not ascending`)
      }
    }
  }
  return errors
}

describe('full-roster visual frame media', () => {
  it('maps move visuals for every fighter and keeps all runtime assets local', () => {
    expect(visualMoveMedia.length).toBeGreaterThanOrEqual(2500)
    const coveredFighters = new Set(visualMoveMedia.map((media) => media.fighterId))
    expect(coveredFighters.size).toBe(89)
    expect(roster.every((fighter) => coveredFighters.has(fighter.id))).toBe(true)
    expect(validateVisualMedia()).toEqual([])
  })

  it('provides exact frame-addressable sheets at full-roster scale', () => {
    const withExactSheets = visualMoveMedia.filter((media) => media.variants?.some((variant) => variant.spriteSheet))
    expect(withExactSheets.length).toBeGreaterThanOrEqual(2000)
    const exactFighters = new Set(withExactSheets.map((media) => media.fighterId))
    expect(exactFighters.size).toBe(89)
  })

  it('retains all five Pyra and Mythra aerial study views', () => {
    const aerials = ['neutral-air', 'forward-air', 'back-air', 'up-air', 'down-air']
    for (const fighterId of ['pyra', 'mythra']) {
      const covered = new Set(visualMoveMedia.filter((media) => media.fighterId === fighterId).map((media) => media.moveId))
      expect(aerials.every((moveId) => covered.has(moveId)), fighterId).toBe(true)
    }
  })
})
