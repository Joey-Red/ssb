import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const plan = readFileSync(new URL('../../docs/PRO_LAB_LONG_TERM_PLAN.md', import.meta.url), 'utf8')

describe('Pro Lab long-term completion plan', () => {
  it('keeps the content-first completion targets explicit for future work', () => {
    expect(plan).toContain('12 strong sets per fighter')
    expect(plan).toContain('2–5 credible high-level representatives per fighter')
    expect(plan).toContain('thousands of real, timestamped observations')
    expect(plan).toContain('milestone')
    expect(plan).toContain('feature-complete')
  })
})
