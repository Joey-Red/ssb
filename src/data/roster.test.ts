import { describe, expect, it } from 'vitest'
import { validateRoster } from '../lib/validation'
import { roster } from './roster'

describe('roster manifest', () => {
  it('contains the complete independent SSBU fighter roster without duplicate routes', () => {
    expect(validateRoster(roster)).toEqual([])
  })

  it('represents transformations and echoes explicitly', () => {
    expect(roster.find((fighter) => fighter.id === 'squirtle')?.relation?.type).toBe('pokemon-trainer-form')
    expect(roster.find((fighter) => fighter.id === 'mythra')?.relation?.type).toBe('aegis-form')
    expect(roster.find((fighter) => fighter.id === 'lucina')?.relation?.type).toBe('echo')
  })
})
