import { describe, expect, it } from 'vitest'
import { officialFighterCode, officialFighterRenderUrl, officialFighterThumbUrl } from './officialFighterAssets'

describe('official fighter assets', () => {
  it('uses predictable Smash site codes for normal fighter ids', () => {
    expect(officialFighterCode('kazuya')).toBe('kazuya')
    expect(officialFighterCode('donkey-kong')).toBe('donkey_kong')
    expect(officialFighterCode('king-k-rool')).toBe('king_k_rool')
  })

  it('handles official-site code exceptions', () => {
    expect(officialFighterCode('pyra')).toBe('homura')
    expect(officialFighterCode('mythra')).toBe('hikari')
    expect(officialFighterCode('incineroar')).toBe('gaogaen')
    expect(officialFighterCode('piranha-plant')).toBe('packun_flower')
  })

  it('builds https render and thumbnail urls', () => {
    expect(officialFighterRenderUrl('mario')).toBe('https://www.smashbros.com/assets_v2/img/fighter/mario/main.png')
    expect(officialFighterThumbUrl('mario')).toBe('https://www.smashbros.com/assets_v2/img/fighter/thumb_v/mario.png')
  })
})
