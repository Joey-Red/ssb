import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('hash router', () => {
  it('routes roster, fighter, practice, drills, tools, Pro Lab review and about pages', () => {
    expect(parseRoute('#/')).toEqual({ page: 'roster' })
    expect(parseRoute('#/fighter/mario')).toEqual({ page: 'fighter', slug: 'mario' })
    expect(parseRoute('#/practice/mythra')).toEqual({ page: 'practice', slug: 'mythra' })
    expect(parseRoute('#/drills')).toEqual({ page: 'drills' })
    expect(parseRoute('#/tools')).toEqual({ page: 'tools' })
    expect(parseRoute('#/pro-lab')).toEqual({ page: 'pro-lab' })
    expect(parseRoute('#/pro-lab/pyra')).toEqual({ page: 'pro-lab', slug: 'pyra' })
    expect(parseRoute('#/pro-lab/review/kagaribi15-stream-sparg0-mkleo-wqf')).toEqual({ page: 'pro-review', vodId: 'kagaribi15-stream-sparg0-mkleo-wqf' })
    expect(parseRoute('#/pro-lab/review/set%20one')).toEqual({ page: 'pro-review', vodId: 'set one' })
    expect(parseRoute('#/about')).toEqual({ page: 'about' })
  })

  it('prioritizes evidence review routes over fighter workspaces', () => {
    expect(parseRoute('#/pro-lab/review/vod-123')).toEqual({ page: 'pro-review', vodId: 'vod-123' })
    expect(parseRoute('#/pro-lab/review')).toEqual({ page: 'pro-lab', slug: 'review' })
  })

  it('rejects unknown or malformed routes', () => {
    expect(parseRoute('#/fighter/Mario')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/pro-lab/Pyra')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/pro-lab/review/%E0%A4%A')).toEqual({ page: 'not-found' })
    expect(parseRoute('#/anything-else')).toEqual({ page: 'not-found' })
  })
})
