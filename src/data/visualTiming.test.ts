import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import type { FrameDataSnapshot } from '../types'

type SourceMove = { fighterId: string; moveId: string; totalFrames: number | null; active: string | null; activeSpan: number[] }
type SourceManifest = { version: 2; moves: SourceMove[] }
type AssetManifest = { version: 2; moves: Record<string, { variants: Array<{ spriteSheet?: { frameNumbers?: number[] } }> }> }

const index = indexFrameData(snapshotJson as unknown as FrameDataSnapshot)
const source = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaSources.json'), 'utf8')) as SourceManifest
const assets = JSON.parse(readFileSync(join(process.cwd(), 'src/data/visualMediaAssets.generated.json'), 'utf8')) as AssetManifest

describe('visual-media timing consistency', () => {
  it('keeps discovered visual references aligned to committed move timing', () => {
    for (const media of source.moves) {
      const fighter = index.byFighterId.get(media.fighterId)
      expect(fighter, media.fighterId).toBeDefined()
      const move = fighter?.moves.find((candidate) => candidate.id === media.moveId)
      expect(move, `${media.fighterId}/${media.moveId}`).toBeDefined()
      if (!move) continue

      const total = numericValue(move.totalFrames)
      if (total !== null) expect(media.totalFrames, `${media.fighterId}/${media.moveId} total`).toBe(total)

      const expectedStart = firstFrame(move.active)
      const expectedEnd = lastFrame(move.active)
      if (move.active && media.activeSpan.length === 2) {
        if (expectedStart !== null) expect(media.activeSpan[0], `${media.fighterId}/${media.moveId} active start`).toBe(expectedStart)
        if (expectedEnd !== null) expect(media.activeSpan[1], `${media.fighterId}/${media.moveId} active end`).toBe(expectedEnd)
      }

      const staged = assets.moves[`${media.fighterId}:${media.moveId}`]
      expect(staged).toBeDefined()
      for (const variant of staged?.variants ?? []) {
        const frames = variant.spriteSheet?.frameNumbers ?? []
        if (!frames.length || media.activeSpan.length !== 2) continue
        expect(frames[0]).toBeGreaterThanOrEqual(media.activeSpan[0]!)
        expect(frames.at(-1)).toBeLessThanOrEqual(media.activeSpan[1]!)
      }
    }
  })
})
