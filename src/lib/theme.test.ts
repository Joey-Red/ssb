import { afterEach, describe, expect, it } from 'vitest'
import { getTheme, setTheme } from './theme'

afterEach(() => setTheme('festival'))

describe('theme state', () => {
  it('defaults to Festival without stored browser state', () => expect(getTheme()).toBe('festival'))
  it('switches between the supported themes', () => {
    setTheme('titan')
    expect(getTheme()).toBe('titan')
    setTheme('festival')
    expect(getTheme()).toBe('festival')
  })
})
