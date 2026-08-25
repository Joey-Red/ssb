import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import type { VisualMediaCoverage, VisualMoveMedia } from '../types'

type SourceVariant = { id: string; mediaType: 'gif' | 'image' }
type SourceMove = {
  fighterId: string
  moveId: string
  totalFrames: number | null
  activeSpan: number[]
  variants: SourceVariant[]
}
type SourceManifest = {
  version: 2
  fightersScanned: number
  fightersWithVisuals: number
  mappedMoves: number
  mappedVariants: number
  moves: SourceMove[]
}
type AssetVariant = {
  id: string
  imageSrc?: string
  animationSrc?: string
  coverage?: VisualMediaCoverage
  coverageReason?: string
  sourceFrameCount?: number
  spriteSheet?: { src: string; frameCount: number; frameNumbers?: number[] }
}
type AssetManifest = { version: 2; moves: Record<string, { variants: AssetVariant[] }> }
type CoverageReport = {
  version: 1
  mappedMoves: number
  variantCount: number
  fullExactVariants: number
  partialExactVariants: number
  untimedAnimatedVariants: number
  staticVariants: number
  gapCount: number
  gaps: Array<{ fighterId: string; moveId: string; variantId: string; coverage: Exclude<VisualMediaCoverage, 'full'>; reason: string }>
}

const root = process.cwd()
const source = JSON.parse(readFileSync(join(root, 'src/data/visualMediaSources.json'), 'utf8')) as SourceManifest
const assets = JSON.parse(readFileSync(join(root, 'src/data/visualMediaAssets.generated.json'), 'utf8')) as AssetManifest
const coverage = JSON.parse(readFileSync(join(root, 'src/data/visualMediaCoverage.generated.json'), 'utf8')) as CoverageReport

function publicFile(src: string): string {
  return join(root, 'public', src.replace(/^\/+/, ''))
}

function runtimeIndex(fighterId: string): { version: 1; fighterId: string; moves: VisualMoveMedia[] } {
  return JSON.parse(readFileSync(join(root, 'public/data/visual-media', `${fighterId}.json`), 'utf8')) as { version: 1; fighterId: string; moves: VisualMoveMedia[] }
}

describe('full-roster visual frame media', () => {
  it('discovers source visuals for every fighter at full-roster scale with unique per-move variant ids', () => {
    expect(source.version).toBe(2)
    expect(source.fightersScanned).toBe(89)
    expect(source.fightersWithVisuals).toBe(89)
    expect(source.mappedMoves).toBeGreaterThanOrEqual(2500)
    expect(source.mappedVariants).toBeGreaterThanOrEqual(3000)
    expect(new Set(source.moves.map((move) => move.fighterId)).size).toBe(89)
    for (const move of source.moves) {
      const ids = move.variants.map((variant) => variant.id)
      expect(new Set(ids).size, `${move.fighterId}:${move.moveId} duplicate visual variant ids`).toBe(ids.length)
    }
  })

  it('ships every discovered variant locally and promotes every provably complete GIF to full exact coverage', () => {
    expect(assets.version).toBe(2)
    let fullExactVariants = 0

    for (const move of source.moves) {
      const key = `${move.fighterId}:${move.moveId}`
      const staged = assets.moves[key]
      expect(staged, key).toBeDefined()
      expect(staged?.variants.length, key).toBe(move.variants.length)
      const sourceVariants = new Map(move.variants.map((variant) => [variant.id.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 96) || 'visual', variant] as const))

      for (const variant of staged?.variants ?? []) {
        const sourceVariant = sourceVariants.get(variant.id)
        expect(sourceVariant, `${key}/${variant.id} source variant`).toBeDefined()
        expect(['full', 'partial', 'untimed-animation', 'static']).toContain(variant.coverage)
        expect(Boolean(variant.spriteSheet || variant.animationSrc || variant.imageSrc), `${key}/${variant.id}`).toBe(true)

        if (variant.imageSrc) {
          expect(variant.imageSrc).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.imageSrc)), `${key}/${variant.id} image`).toBe(true)
        }
        if (variant.animationSrc) {
          expect(variant.animationSrc).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.animationSrc)), `${key}/${variant.id} animation`).toBe(true)
        }
        if (variant.spriteSheet) {
          const sheet = variant.spriteSheet
          expect(sheet.src).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(sheet.src)), `${key}/${variant.id} sheet`).toBe(true)
          expect(sheet.frameCount).toBeGreaterThan(0)
          expect(sheet.frameNumbers?.length, `${key}/${variant.id} frame map`).toBe(sheet.frameCount)
          const numbers = sheet.frameNumbers ?? []
          expect(new Set(numbers).size).toBe(numbers.length)
          expect(numbers.every((frame, index) => frame > 0 && (index === 0 || frame > numbers[index - 1]!))).toBe(true)
          if (move.totalFrames !== null) {
            expect(numbers.filter((frame) => frame > move.totalFrames!), `${key}/${variant.id} frames beyond total ${move.totalFrames}`).toEqual([])
          }
        }

        if (sourceVariant?.mediaType === 'gif' && move.totalFrames !== null && (variant.sourceFrameCount ?? 0) >= move.totalFrames) {
          expect(variant.coverage, `${key}/${variant.id} complete source should be full`).toBe('full')
        }

        if (variant.coverage === 'full') {
          fullExactVariants += 1
          expect(move.totalFrames, `${key}/${variant.id} full coverage requires total frames`).not.toBeNull()
          expect(variant.spriteSheet, `${key}/${variant.id} full coverage sheet`).toBeDefined()
          const expected = Array.from({ length: move.totalFrames ?? 0 }, (_, index) => index + 1)
          expect(variant.spriteSheet?.frameNumbers, `${key}/${variant.id} complete 1..Total mapping`).toEqual(expected)
          expect(variant.spriteSheet?.frameCount).toBe(move.totalFrames)
        } else if (sourceVariant?.mediaType === 'gif') {
          expect(variant.animationSrc, `${key}/${variant.id} incomplete GIF must stay animated`).toBeDefined()
          expect(variant.coverageReason, `${key}/${variant.id} gap reason`).toBeTruthy()
        }
      }
    }

    expect(fullExactVariants).toBeGreaterThan(0)
  })

  it('generates an explicit residual list for every non-full source variant', () => {
    expect(coverage.version).toBe(1)
    expect(coverage.mappedMoves).toBe(source.mappedMoves)
    expect(coverage.variantCount).toBe(source.mappedVariants)
    expect(coverage.fullExactVariants).toBeGreaterThan(0)
    expect(coverage.fullExactVariants + coverage.gapCount).toBe(coverage.variantCount)
    expect(coverage.gaps).toHaveLength(coverage.gapCount)
    expect(coverage.gaps.every((gap) => gap.reason.length > 0)).toBe(true)

    const stagedNonFull = Object.values(assets.moves)
      .flatMap((move) => move.variants)
      .filter((variant) => variant.coverage !== 'full')
    expect(stagedNonFull).toHaveLength(coverage.gapCount)
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