import { describe, expect, it } from 'vitest'
import type { FighterGuide } from '../types'
import { allGuides } from './allGuides'
import { diddyKongProgression } from './diddyKongProgression'
import { roster } from './roster'
import { sources } from './sources'
import { validateGuides } from '../lib/validation'

describe('Diddy Kong source-video progression', () => {
  it('indexes all four source tiers in chronological order', () => {
    const firstTimestampByTier = Object.fromEntries(
      ['beginner', 'intermediate', 'pro', 'godlike'].map((tier) => [
        tier,
        diddyKongProgression.techniques.find((technique) => technique.tier === tier)?.timestampSeconds,
      ]),
    )

    expect(firstTimestampByTier).toEqual({ beginner: 0, intermediate: 50, pro: 190, godlike: 442 })
    expect(Object.fromEntries(
      ['beginner', 'intermediate', 'pro', 'godlike'].map((tier) => [
        tier,
        diddyKongProgression.techniques.filter((technique) => technique.tier === tier).length,
      ]),
    )).toEqual({ beginner: 11, intermediate: 15, pro: 22, godlike: 17 })
    expect(diddyKongProgression.techniques).toHaveLength(65)
    expect(diddyKongProgression.techniques.every((technique) => technique.route.length >= 2)).toBe(true)
  })

  it('keeps every source-true overlay qualified instead of universalizing it', () => {
    const sourceTrue = diddyKongProgression.techniques.filter((technique) => technique.verdict === 'source-true')
    expect(sourceTrue.length).toBeGreaterThan(0)
    expect(sourceTrue.every((technique) => technique.caveats && technique.caveats.length > 0)).toBe(true)
  })

  it('ships as the ready Diddy guide without breaking static guide validation', () => {
    expect(roster.find((fighter) => fighter.id === 'diddy-kong')?.guideStatus).toBe('ready')
    const diddyGuide = allGuides.find((guide) => guide.fighterId === 'diddy-kong') as FighterGuide | undefined
    expect(diddyGuide?.progression).toBe(diddyKongProgression)
    expect(validateGuides(allGuides, roster, sources)).toEqual([])
  })
})
