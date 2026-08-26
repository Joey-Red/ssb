import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import type { VisualMediaCoverage, VisualMoveMedia, VisualTimelineClass } from '../types'

type SourceVariant = {
  id: string
  mediaType: 'animation' | 'image'
  timelineClass: VisualTimelineClass
  timingBasis: 'parent-action' | 'independent-source'
}
type SourceMove = {
  fighterId: string
  moveId: string
  totalFrames: number | null
  landingLag: number | null
  activeSpan: number[]
  variants: SourceVariant[]
}
type SourceManifest = {
  version: 3
  fightersScanned: number
  fightersWithVisuals: number
  mappedMoves: number
  mappedVariants: number
  timelineCounts: Record<string, number>
  moves: SourceMove[]
}
type AssetVariant = {
  id: string
  imageSrc?: string
  animationSrc?: string
  coverage?: VisualMediaCoverage
  coverageReason?: string
  sourceFrameCount?: number
  sourceDurationMs?: number | null
  timelineClass?: VisualTimelineClass
  timelineTotalFrames?: number
  mappingMethod?: string
  interactionEvidence?: 'embedded-source' | 'reviewed-overlay'
  spriteSheet?: { src: string; frameCount: number; frameNumbers?: number[]; gameFrameCells?: number[] }
  sourcePlaybackSheet?: { src: string; frameCount: number; frameNumbers?: number[]; gameFrameCells?: number[] }
  sourcePlaybackFrameCount?: number
}
type AssetManifest = { version: 3; moves: Record<string, { variants: AssetVariant[] }> }
type CoverageReport = {
  version: 2
  mappedMoves: number
  variantCount: number
  resolvedVariants: number
  unresolvedVariants: number
  fullExactVariants: number
  sourceTimedVariants: number
  exactStaticVariants: number
  gapCount: number
  blockerCounts: Record<string, number>
  gaps: Array<{ fighterId: string; moveId: string; variantId: string; coverage: VisualMediaCoverage; reason: string; blockerClass: string }>
}

const resolvedCoverage = new Set<VisualMediaCoverage>(['full', 'source-timed', 'exact-static'])
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
  it('discovers source visuals for every fighter and classifies every source timeline', () => {
    expect(source.version).toBe(3)
    expect(source.fightersScanned).toBe(89)
    expect(source.fightersWithVisuals).toBe(89)
    expect(source.mappedMoves).toBeGreaterThanOrEqual(2500)
    expect(source.mappedVariants).toBeGreaterThanOrEqual(3000)
    expect(new Set(source.moves.map((move) => move.fighterId)).size).toBe(89)
    expect(Object.keys(source.timelineCounts).length).toBeGreaterThan(1)
    for (const move of source.moves) {
      const ids = move.variants.map((variant) => variant.id)
      expect(new Set(ids).size, `${move.fighterId}:${move.moveId} duplicate visual variant ids`).toBe(ids.length)
      for (const variant of move.variants) {
        expect(variant.timelineClass, `${move.fighterId}:${move.moveId}/${variant.id}`).toBeTruthy()
        expect(variant.timingBasis).toBe(variant.timelineClass === 'fighter-action' ? 'parent-action' : 'independent-source')
      }
    }
  })

  it('ships every discovered variant locally with bounded, explicit timeline mappings and source collision evidence', () => {
    expect(assets.version).toBe(3)
    let fullExactVariants = 0
    const invalidFullTimelines: string[] = []

    for (const move of source.moves) {
      const key = `${move.fighterId}:${move.moveId}`
      const staged = assets.moves[key]
      expect(staged, key).toBeDefined()
      expect(staged?.variants.length, key).toBe(move.variants.length)
      const sourceVariants = new Map(move.variants.map((variant) => [variant.id.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 96) || 'visual', variant] as const))

      for (const variant of staged?.variants ?? []) {
        const sourceVariant = sourceVariants.get(variant.id)
        expect(sourceVariant, `${key}/${variant.id} source variant`).toBeDefined()
        expect(['full', 'source-timed', 'exact-static', 'partial', 'untimed-animation', 'static']).toContain(variant.coverage)
        expect(Boolean(variant.spriteSheet || variant.animationSrc || variant.imageSrc), `${key}/${variant.id}`).toBe(true)
        expect(variant.timelineClass).toBe(sourceVariant?.timelineClass)
        expect(variant.interactionEvidence, `${key}/${variant.id} collision provenance`).toBe('embedded-source')

        if (variant.imageSrc) {
          expect(variant.imageSrc).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.imageSrc)), `${key}/${variant.id} image`).toBe(true)
        }
        if (variant.animationSrc) {
          expect(variant.animationSrc).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.animationSrc)), `${key}/${variant.id} animation`).toBe(true)
        }
        if (variant.sourcePlaybackSheet) {
          expect(variant.sourcePlaybackSheet.src).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(variant.sourcePlaybackSheet.src)), `${key}/${variant.id} source playback sheet`).toBe(true)
          expect(variant.sourcePlaybackFrameCount).toBe(variant.sourcePlaybackSheet.frameCount)
        }
        if (variant.spriteSheet) {
          const sheet = variant.spriteSheet
          expect(sheet.src).not.toMatch(/^https?:\/\//)
          expect(existsSync(publicFile(sheet.src)), `${key}/${variant.id} sheet`).toBe(true)
          expect(sheet.frameCount).toBeGreaterThan(0)
          expect(sheet.frameNumbers?.length, `${key}/${variant.id} physical cell map`).toBe(sheet.frameCount)
          const numbers = sheet.frameNumbers ?? []
          expect(new Set(numbers).size).toBe(numbers.length)
          expect(numbers.every((frame, index) => frame > 0 && (index === 0 || frame > numbers[index - 1]!))).toBe(true)
          if (sheet.gameFrameCells) {
            expect(sheet.gameFrameCells.length, `${key}/${variant.id} held-frame map`).toBe(variant.timelineTotalFrames)
            expect(sheet.gameFrameCells.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < sheet.frameCount)).toBe(true)
          }
        }

        if (sourceVariant?.mediaType === 'animation') {
          expect(variant.animationSrc, `${key}/${variant.id} animation source must remain locally archived`).toBeDefined()
        }

        if (variant.coverage === 'full') {
          fullExactVariants += 1
          expect(variant.timelineTotalFrames, `${key}/${variant.id} full timeline length`).toBeGreaterThan(0)
          expect(variant.spriteSheet, `${key}/${variant.id} full coverage sheet`).toBeDefined()
          if (variant.spriteSheet?.gameFrameCells) {
            expect(variant.spriteSheet.gameFrameCells).toHaveLength(variant.timelineTotalFrames ?? 0)
          } else {
            const expected = Array.from({ length: variant.timelineTotalFrames ?? 0 }, (_, index) => index + 1)
            expect(variant.spriteSheet?.frameNumbers, `${key}/${variant.id} complete 1..timeline mapping`).toEqual(expected)
          }
          if (sourceVariant?.timelineClass === 'fighter-action' && move.activeSpan.length === 2) {
            const firstActive = move.activeSpan[0]!
            const lastActive = move.activeSpan[1]!
            const timelineTotal = variant.timelineTotalFrames ?? 0
            expect(firstActive).toBeGreaterThan(0)
            if (lastActive > timelineTotal) {
              invalidFullTimelines.push(`${key}/${variant.id} active ${firstActive}-${lastActive} exceeds full timeline ${timelineTotal}`)
            }
          }
        } else if (sourceVariant?.mediaType === 'animation') {
          expect(variant.coverageReason, `${key}/${variant.id} coverage reason`).toBeTruthy()
        }
      }
    }

    expect(fullExactVariants).toBeGreaterThan(0)
    expect(invalidFullTimelines, `misclassified full parent-action timelines:\n${invalidFullTimelines.join('\n')}`).toEqual([])
  })

  it('generates an explicit blocker list containing exactly the unresolved variants', () => {
    expect(coverage.version).toBe(2)
    expect(coverage.mappedMoves).toBe(source.mappedMoves)
    expect(coverage.variantCount).toBe(source.mappedVariants)
    expect(coverage.resolvedVariants + coverage.unresolvedVariants).toBe(coverage.variantCount)
    expect(coverage.gapCount).toBe(coverage.unresolvedVariants)
    expect(coverage.gaps).toHaveLength(coverage.gapCount)
    expect(coverage.gaps.every((gap) => gap.reason.length > 0 && gap.blockerClass.length > 0)).toBe(true)

    const stagedUnresolved = Object.values(assets.moves)
      .flatMap((move) => move.variants)
      .filter((variant) => !resolvedCoverage.has(variant.coverage ?? 'partial'))
    expect(stagedUnresolved).toHaveLength(coverage.unresolvedVariants)
  })

  it('splits runtime metadata into one local index per fighter and distinguishes real runtime aliases from synthetic fallbacks', () => {
    const dir = join(root, 'public/data/visual-media')
    expect(readdirSync(dir).filter((name) => name.endsWith('.json'))).toHaveLength(89)
    let moveCount = 0
    let syntheticVariantCount = 0
    let relatedSourceMoveCount = 0
    for (const fighter of roster) {
      const payload = runtimeIndex(fighter.id)
      expect(payload.version).toBe(1)
      expect(payload.fighterId).toBe(fighter.id)
      expect(payload.moves.length).toBeGreaterThan(0)
      expect(new Set(payload.moves.map((move) => move.moveId)).size).toBe(payload.moves.length)
      for (const move of payload.moves) {
        let relatedSourceMove = false
        for (const variant of move.variants ?? []) {
          if (variant.sourceFormat === 'synthetic-illustrative') {
            syntheticVariantCount += 1
            expect(variant.interactionEvidence, `${fighter.id}:${move.moveId}/${variant.id} synthetic collision evidence`).toBeUndefined()
            expect(variant.mappingMethod).toBe('synthetic-phase-schematic-not-source-evidence')
          } else {
            expect(variant.interactionEvidence, `${fighter.id}:${move.moveId}/${variant.id} runtime collision provenance`).toBeTruthy()
            if (variant.mappingMethod === 'runtime-related-source-alias-not-coverage-evidence') {
              relatedSourceMove = true
              expect(variant.coverage).toBe('partial')
              expect(variant.timingBasis).toBe('independent-source')
            }
          }
        }
        if (relatedSourceMove) relatedSourceMoveCount += 1
      }
      moveCount += payload.moves.length
    }
    expect(moveCount).toBeGreaterThanOrEqual(source.mappedMoves)
    expect(moveCount).toBeLessThanOrEqual(3588)
    expect(relatedSourceMoveCount).toBeGreaterThan(0)
    expect(syntheticVariantCount + relatedSourceMoveCount).toBe(moveCount - source.mappedMoves)
  })
})
