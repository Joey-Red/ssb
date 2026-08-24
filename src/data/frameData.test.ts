import { describe, expect, it } from 'vitest'
import snapshotJson from './frameData.generated.json'
import { indexFrameData } from './frameData'
import { roster } from './roster'
import type { FrameDataSnapshot } from '../types'

const frameDataSnapshot = snapshotJson as unknown as FrameDataSnapshot
const { byFighterId: frameDataByFighterId, moveCount: frameMoveCount } = indexFrameData(frameDataSnapshot)
const categories = new Set(['ground', 'aerial', 'special', 'grab', 'defense', 'misc'])

describe('committed frame-data snapshot', () => {
  it('covers the complete canonical roster with substantial move data', () => {
    expect(frameDataByFighterId.size).toBe(roster.length)
    expect(frameDataByFighterId.size).toBe(89)
    expect(frameMoveCount).toBeGreaterThan(1000)
    for (const fighter of roster) {
      const data = frameDataByFighterId.get(fighter.id)
      expect(data, `${fighter.id} frame data`).toBeDefined()
      expect(data?.name).toBe(fighter.name)
      expect(data?.moves.length, `${fighter.id} move rows`).toBeGreaterThanOrEqual(12)
      expect(data?.sourceUrl).toBe(`https://ultimateframedata.com/${data?.sourceUrl.split('/').at(-1)}`)
    }
  })

  it('keeps move rows structurally safe and does not bundle source prose', () => {
    for (const fighter of frameDataByFighterId.values()) {
      const ids = new Set<string>()
      for (const move of fighter.moves) {
        expect(ids.has(move.id), `${fighter.fighterId}/${move.id} duplicate id`).toBe(false)
        ids.add(move.id)
        expect(move.name.trim().length).toBeGreaterThan(0)
        expect(categories.has(move.category)).toBe(true)
        expect(move.notes).toBeNull()
        if (move.startupFrame !== null) expect(move.startupFrame).toBeGreaterThan(0)
      }
    }
  })

  it('records canonical and maintenance provenance separately', () => {
    expect(frameDataSnapshot.source.id).toBe('ultimate-frame-data')
    expect(frameDataSnapshot.source.baseUrl).toBe('https://ultimateframedata.com')
    expect(frameDataSnapshot.source.transportMirror).toBe('https://github.com/TheFakeNatty/smash-data')
  })
})
