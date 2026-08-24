import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('hash router', () => {
  it('routes roster, fighter, practice, tools and about pages', () => {
    expect(parseRoute('#/')).toEqual({ page: 'roster' })
    expect(parseRoute('#/fighter/mario')).toEqual({ page: 'fighter', slug: 'mario' })
    expect(parseRoute('#/practice/mythra')).toEqual({ page: 'practice', slug: 'mythra' })
    expect(parseRoute('#/tools')).toEqual({ page: 'tools' })
    expect(parseRoute('#/about')).toEqual({ page: 'about' })
  })

  it('rejects unknown or malformed routes', () => {
    expect(parseRoute('#/fighter/Mario')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/anything-else')).toEqual({ page: 'not-found' })
  })
})
