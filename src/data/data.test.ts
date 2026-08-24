import { describe, expect, it } from 'vitest'
import { validateGuides, validateRoster } from '../lib/validation'
import { allGuides } from './allGuides'
import { roster } from './roster'
import { sources } from './sources'

describe('static SSBU data', () => {
  it('has a complete unique fighter manifest', () => expect(validateRoster(roster)).toEqual([]))
  it('has valid source-aware guides for the complete roster', () => expect(validateGuides(allGuides, roster, sources)).toEqual([]))
  it('covers every roster fighter exactly once', () => {
    expect(allGuides.map((guide) => guide.fighterId).sort()).toEqual(roster.map((fighter) => fighter.id).sort())
  })
  it('never labels an unverified route true', () => {
    const invalid = allGuides.flatMap((guide) => guide.combos.filter((combo) => combo.kind === 'true' && combo.confidence !== 'verified'))
    expect(invalid).toEqual([])
  })
})
