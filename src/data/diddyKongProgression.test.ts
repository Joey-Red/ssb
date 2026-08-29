import { describe, expect, it } from 'vitest'
import { allGuides } from './allGuides'
import { diddyKongProgression } from './diddyKongProgression'
import { roster } from './roster'
import { sources } from './sources'
import { validateGuides, validateTechniqueProgression } from '../lib/validation'

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
    )).toEqual({ beginner: 19, intermediate: 46, pro: 28, godlike: 20 })
    expect(diddyKongProgression.techniques).toHaveLength(113)
    expect(diddyKongProgression.techniques.every((technique) => technique.route.length >= 2)).toBe(true)
    expect(diddyKongProgression.techniques.every((technique) => Number.isInteger(technique.opponentStartPercent))).toBe(true)
  })

  it('locks the frame-audited opening inputs and removes generic route placeholders', () => {
    expect(diddyKongProgression.techniques.slice(0, 3).map((technique) => ({
      timestampSeconds: technique.timestampSeconds,
      opponentStartPercent: technique.opponentStartPercent,
      route: technique.route,
    }))).toEqual([
      { timestampSeconds: 0, opponentStartPercent: 0, route: ['Up throw', 'Up air'] },
      { timestampSeconds: 3, opponentStartPercent: 15, route: ['Up throw', 'Back air'] },
      { timestampSeconds: 6, opponentStartPercent: 15, route: ['Up throw', 'Forward air'] },
    ])

    const forbiddenPlaceholders = new Set(['Starter', 'Aerial starter', 'Aerial chase', 'Aerial string', 'Finisher', 'Launcher', 'Setup hit'])
    expect(diddyKongProgression.techniques.flatMap((technique) => technique.route).filter((step) => forbiddenPlaceholders.has(step))).toEqual([])
  })

  it('keeps every source-true overlay qualified instead of universalizing it', () => {
    const sourceTrue = diddyKongProgression.techniques.filter((technique) => technique.verdict === 'source-true')
    expect(sourceTrue.length).toBeGreaterThan(0)
    expect(sourceTrue.every((technique) => technique.caveats && technique.caveats.length > 0)).toBe(true)
  })

  it('ships as the ready Diddy guide without breaking static guide validation', () => {
    expect(roster.find((fighter) => fighter.id === 'diddy-kong')?.guideStatus).toBe('ready')
    const diddyGuide = allGuides.find((guide) => guide.fighterId === 'diddy-kong')
    expect(diddyGuide?.sourceIds).toContain(diddyKongProgression.sourceId)
    expect(validateTechniqueProgression(diddyKongProgression, sources, diddyGuide?.sourceIds ?? [])).toEqual([])
    expect(validateGuides(allGuides, roster, sources)).toEqual([])
  })
})
