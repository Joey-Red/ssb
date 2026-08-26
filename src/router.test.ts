import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('hash router', () => {
  it('routes roster, fighter, practice, drills, tools, Pro Lab and about pages', () => {
    expect(parseRoute('#/')).toEqual({ page: 'roster' })
    expect(parseRoute('#/fighter/mario')).toEqual({ page: 'fighter', slug: 'mario' })
    expect(parseRoute('#/practice/mythra')).toEqual({ page: 'practice', slug: 'mythra' })
    expect(parseRoute('#/drills')).toEqual({ page: 'drills' })
    expect(parseRoute('#/tools')).toEqual({ page: 'tools' })
    expect(parseRoute('#/pro-lab')).toEqual({ page: 'pro-lab' })
    expect(parseRoute('#/pro-lab/pyra')).toEqual({ page: 'pro-lab', slug: 'pyra' })
    expect(parseRoute('#/about')).toEqual({ page: 'about' })
  })

  it('rejects unknown or malformed routes', () => {
    expect(parseRoute('#/fighter/Mario')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/pro-lab/Pyra')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/anything-else')).toEqual({ page: 'not-found' })
  })
})
