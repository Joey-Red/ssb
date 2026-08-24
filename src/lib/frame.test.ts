import { describe, expect, it } from 'vitest'
import { formatActiveWindow, formatFrames, framesToMilliseconds } from './frame'

describe('frame utilities', () => {
  it('converts one SSBU frame to milliseconds', () => {
    expect(framesToMilliseconds(1)).toBeCloseTo(16.6667, 3)
  })

  it('formats frame notation without alternate timing units', () => {
    expect(formatFrames(5)).toBe('5f')
    expect(formatActiveWindow(5, 7)).toBe('5–7f')
  })

  it('rejects invalid frame input', () => {
    expect(() => formatFrames(-1)).toThrow(RangeError)
    expect(() => formatActiveWindow(7, 5)).toThrow(RangeError)
  })
})
