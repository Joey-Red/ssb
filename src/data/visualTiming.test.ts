import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import type { FrameDataSnapshot, VisualMediaCoverage } from '../types'

type SourceMove = { fighterId: string; moveId: string; totalFrames: number | null; active: string | null; activeSpan: number[] }
type AssetManifest = { version: 2; moves: Record<string, { variants: Array<{ id?: string; coverage?: VisualMediaCoverage; spriteSheet?: { frameNumbers?: number[] } }> }> }
type SourceManifest = { version: 2; moves: SourceMove[] }

const index = indexFrameData(snapshotJson as unknown as FrameDataSnapshot)
const source = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaSources.json'), 'utf8')) as SourceManifest
const assets = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaAssets.generated.json'), 'utf8')) as AssetManifest

describe('visual-media timing consistency', () => {
  it('keeps full variants mapped to 1..Total and partial variants inside the conservative active span', () => {
    const stagedRangeMismatches: string[] = []

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
        const frames = variant.spriteSheet?.frameNumbers ?? []
        if (!frames.length) continue

        if (variant.coverage === 'full') {
          if (total === null) {
            stagedRangeMismatches.push(`${key}/${variant.id ?? 'unnamed'} claims full coverage without Total Frames`)
            continue
          }
          const expected = Array.from({ length: total }, (_, index) => index + 1)
          if (frames.length !== expected.length || frames.some((frame, index) => frame !== expected[index])) {
            stagedRangeMismatches.push(`${key}/${variant.id ?? 'unnamed'} full mapping is not 1-${total}`)
          }
          continue
        }

        if (media.activeSpan.length !== 2) continue
        const first = frames[0]!
        const last = frames.at(-1)!
        const activeStart = media.activeSpan[0]!
        const activeEnd = media.activeSpan[1]!
        if (first < activeStart || last > activeEnd) {
          stagedRangeMismatches.push(`${key}/${variant.id ?? 'unnamed'} partial staged ${first}-${last}, active ${activeStart}-${activeEnd}`)
        }
      }
    }

    expect(stagedRangeMismatches).toEqual([])
  })
})
