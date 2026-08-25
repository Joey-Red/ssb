import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import type { VisualMoveMedia } from '../types'

type SourceManifest = {
  version: 2
  fightersScanned: number
  fightersWithVisuals: number
  mappedMoves: number
  mappedVariants: number
  moves: Array<{ fighterId: string; moveId: string; totalFrames: number | null; activeSpan: number[]; variants: Array<{ id: string }> }>
}
type AssetVariant = { id: string; imageSrc?: string; spriteSheet?: { src: string; frameCount: number; frameNumbers?: number[] } }
type AssetManifest = { version: 2; moves: Record<string, { variants: AssetVariant[] }> }

const root = process.cwd()
const source = JSON.parse(readFileSync(join(root, 'src/data/visualMediaSources.json'), 'utf8')) as SourceManifest
const assets = JSON.parse(readFileSync(join(root, 'src/data/visualMediaAssets.generated.json'), 'utf8')) as AssetManifest

function publicFile(src: string): string {
  return join(root, 'public', src.replace(/^\/+/, ''))
}

function runtimeIndex(fighterId: string): { version: 1; fighterId: string; moves: VisualMoveMedia[] } {
  return JSON.parse(readFileSync(join(root, 'public/data/visual-media', `${fighterId}.json`), 'utf8')) as { version: 1; fighterId: string; moves: VisualMoveMedia[] }
}

describe('full-roster visual frame media', () => {
  it('discovers source visuals for every fighter at full-roster scale', () => {
    expect(source.version).toBe(2)
    expect(source.fightersScanned).toBe(89)
    expect(source.fightersWithVisuals).toBe(89)
    expect(source.mappedMoves).toBeGreaterThanOrEqual(2500)
    expect(source.mappedVariants).toBeGreaterThanOrEqual(3000)
    expect(new Set(source.moves.map((move) => move.fighterId)).size).toBe(89)
  })

  it('ships every discovered variant as a same-origin local runtime asset', () => {
    expect(assets.version).toBe(2)
    let exactSheetMoves = 0
    for (const move of source.moves) {
      const key = `${move.fighterId}:${move.moveId}`
      const staged = assets.moves[key]
      expect(staged, key).toBeDefined()
      expect(staged?.variants.length, key).toBe(move.variants.length)
      let hasSheet = false
      for (const variant of staged?.variants ?? []) {
        expect(Boolean(variant.spriteSheet || variant.imageSrc), `${key}/${variant.id}`).toBe(true)
        if (variant.imageSrc) {
          expect(variant.imageSrc).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.imageSrc)), `${key}/${variant.id} image`).toBe(true)
        }
        if (variant.spriteSheet) {
          hasSheet = true
          const sheet = variant.spriteSheet
          expect(sheet.src).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(sheet.src)), `${key}/${variant.id} sheet`).toBe(true)
          expect(sheet.frameCount).toBeGreaterThan(0)
          expect(sheet.frameNumbers?.length, `${key}/${variant.id} frame map`).toBe(sheet.frameCount)
          const numbers = sheet.frameNumbers ?? []
          expect(new Set(numbers).size).toBe(numbers.length)
          expect(numbers.every((frame, index) => frame > 0 && (index === 0 || frame > numbers[index - 1]!))).toBe(true)
          if (move.totalFrames !== null) {
            const overflow = numbers.filter((frame) => frame > move.totalFrames!)
            expect(overflow, `${key}/${variant.id} frames beyond total ${move.totalFrames}`).toEqual([])
          }
        }
      }
      if (hasSheet) exactSheetMoves += 1
    }
    expect(exactSheetMoves).toBeGreaterThanOrEqual(2000)
  })

  it('splits runtime metadata into one compact local index per fighter', () => {
    const dir = join(root, 'public/data/visual-media')
    expect(readdirSync(dir).filter((name) => name.endsWith('.json'))).toHaveLength(89)
    let moveCount = 0
    for (const fighter of roster) {
      const payload = runtimeIndex(fighter.id)
      expect(payload.version).toBe(1)
      expect(payload.fighterId).toBe(fighter.id)
      expect(payload.moves.length).toBeGreaterThan(0)
      moveCount += payload.moves.length
    }
    expect(moveCount).toBe(source.mappedMoves)
  })
})
