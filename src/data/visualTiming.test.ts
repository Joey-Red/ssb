import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import type { FrameDataSnapshot, VisualMediaCoverage, VisualTimelineClass } from '../types'

type SourceMove = {
  fighterId: string
  moveId: string
  totalFrames: number | null
  landingLag: number | null
  active: string | null
  activeSpan: number[]
}
type AssetVariant = {
  id?: string
  coverage?: VisualMediaCoverage
  timelineClass?: VisualTimelineClass
  timelineTotalFrames?: number
  timelineBasis?: string
  spriteSheet?: { frameCount: number; frameNumbers?: number[]; gameFrameCells?: number[] }
}
type AssetManifest = { version: 3; moves: Record<string, { variants: AssetVariant[] }> }
type SourceManifest = { version: 3; moves: SourceMove[] }

const index = indexFrameData(snapshotJson as unknown as FrameDataSnapshot)
const source = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaSources.json'), 'utf8')) as SourceManifest
const assets = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaAssets.generated.json'), 'utf8')) as AssetManifest

describe('visual-media timing consistency', () => {
  it('keeps parent-action timing exact and auxiliary timing independent', () => {
    const mismatches: string[] = []

    for (const media of source.moves) {
      const fighter = index.byFighterId.get(media.fighterId)
      expect(fighter, media.fighterId).toBeDefined()
      const move = fighter?.moves.find((candidate) => candidate.id === media.moveId)
      const key = `${media.fighterId}/${media.moveId}`
      expect(move, key).toBeDefined()
      if (!move) continue

      const total = numericValue(move.totalFrames)
      if (total !== null) expect(media.totalFrames, `${key} total`).toBe(total)

      const expectedStart = firstFrame(move.active)
      const expectedEnd = lastFrame(move.active)
      if (move.active && media.activeSpan.length === 2) {
        if (expectedStart !== null) expect(media.activeSpan[0], `${key} active start`).toBe(expectedStart)
        if (expectedEnd !== null) expect(media.activeSpan[1], `${key} active end`).toBe(expectedEnd)
      }

      const staged = assets.moves[`${media.fighterId}:${media.moveId}`]
      expect(staged, `${key} staged media`).toBeDefined()
      for (const variant of staged?.variants ?? []) {
        const timelineClass = variant.timelineClass ?? 'fighter-action'
        const frames = variant.spriteSheet?.frameNumbers ?? []
        const heldMap = variant.spriteSheet?.gameFrameCells

        if (variant.coverage === 'full') {
          const timelineTotal = variant.timelineTotalFrames
          if (!timelineTotal) {
            mismatches.push(`${key}/${variant.id ?? 'unnamed'} full coverage has no timeline length`)
            continue
          }
          if (timelineClass === 'fighter-action' && timelineTotal !== total) {
            mismatches.push(`${key}/${variant.id ?? 'unnamed'} fighter timeline ${timelineTotal} != documented total ${total}`)
          }
          if (timelineClass === 'landing' && media.landingLag !== null && timelineTotal !== media.landingLag) {
            mismatches.push(`${key}/${variant.id ?? 'unnamed'} landing timeline ${timelineTotal} != landing lag ${media.landingLag}`)
          }
          if (heldMap) {
            if (heldMap.length !== timelineTotal) mismatches.push(`${key}/${variant.id ?? 'unnamed'} held map does not cover every timeline frame`)
            if (heldMap.some((cell) => cell < 0 || cell >= (variant.spriteSheet?.frameCount ?? 0))) {
              mismatches.push(`${key}/${variant.id ?? 'unnamed'} held map addresses an invalid source cell`)
            }
          } else {
            const expected = Array.from({ length: timelineTotal }, (_, frameIndex) => frameIndex + 1)
            if (frames.length !== expected.length || frames.some((frame, frameIndex) => frame !== expected[frameIndex])) {
              mismatches.push(`${key}/${variant.id ?? 'unnamed'} direct full mapping is not 1-${timelineTotal}`)
            }
          }
          continue
        }

        if (variant.coverage === 'source-timed' || variant.coverage === 'exact-static') {
          if (timelineClass === 'fighter-action') {
            mismatches.push(`${key}/${variant.id ?? 'unnamed'} parent fighter action cannot be resolved only as ${variant.coverage}`)
          }
          continue
        }

        if (timelineClass !== 'fighter-action' || !frames.length || media.activeSpan.length !== 2) continue
        const first = frames[0]!
        const last = frames.at(-1)!
        const activeStart = media.activeSpan[0]!
        const activeEnd = media.activeSpan[1]!
        if (first < activeStart || last > activeEnd) {
          mismatches.push(`${key}/${variant.id ?? 'unnamed'} partial staged ${first}-${last}, active ${activeStart}-${activeEnd}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
