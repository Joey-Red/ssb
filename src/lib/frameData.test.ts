import { describe, expect, it } from 'vitest'
import type { FrameMove } from '../types'
import { firstFrame, frameNumbers, lastFrame, oosTiming } from './frameData'

const baseMove: FrameMove = {
  id: 'test', name: 'Test', category: 'ground', startup: '5', startupFrame: 5,
  active: '5—7', totalFrames: '30', faf: null, landingLag: null, autocancel: null,
  damage: '7.0', onShield: '-10', shieldLag: null, shieldStun: null,
  hitboxType: null, endLag: null, notes: null,
}

describe('frame-data helpers', () => {
  it('preserves multi-value notation while finding its numeric bounds', () => {
    expect(frameNumbers('5/7/9/11/13/23(1—2)')).toEqual([5, 7, 9, 11, 13, 23, 1, 2])
    expect(firstFrame('5—7')).toBe(5)
    expect(lastFrame('5—7')).toBe(7)
    expect(lastFrame('17—19/25—39(2)')).toBe(39)
  })

  it('adds the universal 3-frame jumpsquat to aerial OOS startup', () => {
    expect(oosTiming({ ...baseMove, name: 'Neutral Air', category: 'aerial', startupFrame: 3, startup: '3' })?.startup).toBe(6)
  })

  it('keeps up smash and up special direct out of shield', () => {
    expect(oosTiming({ ...baseMove, name: 'Up Smash', startupFrame: 9, startup: '9' })?.startup).toBe(9)
    expect(oosTiming({ ...baseMove, name: 'Up B (Test)', category: 'special', startupFrame: 4, startup: '4' })?.startup).toBe(4)
  })
})
