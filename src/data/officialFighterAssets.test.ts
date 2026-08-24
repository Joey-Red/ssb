import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { officialFighterCode, officialFighterRenderUrl, officialFighterThumbUrl } from './officialFighterAssets'

describe('official fighter assets', () => {
  it('produces HTTPS render and thumbnail URLs for the full roster', () => {
    for (const fighter of roster) {
      expect(officialFighterRenderUrl(fighter.id)).toMatch(/^https:\/\/www\.smashbros\.com\/assets_v2\/img\/fighter\/.+\/main\.png$/)
      expect(officialFighterThumbUrl(fighter.id)).toMatch(/^https:\/\/www\.smashbros\.com\/assets_v2\/img\/fighter\/thumb_v\/.+\.png$/)
    }
  })

  it('uses canonical English site slugs for independently listed fighters', () => {
    expect(officialFighterCode('pyra')).toBe('pyra')
    expect(officialFighterCode('mythra')).toBe('mythra')
    expect(officialFighterCode('joker')).toBe('joker')
    expect(officialFighterCode('king-k-rool')).toBe('king_k_rool')
    expect(officialFighterCode('mr-game-and-watch')).toBe('mr_game_and_watch')
  })

  it('uses shared official asset groups only where the site exposes a shared fighter asset', () => {
    expect(officialFighterCode('squirtle')).toBe('pokemon_trainer')
    expect(officialFighterCode('ivysaur')).toBe('pokemon_trainer')
    expect(officialFighterCode('charizard')).toBe('pokemon_trainer')
    expect(officialFighterCode('mii-brawler')).toBe('mii_fighter')
    expect(officialFighterCode('mii-swordfighter')).toBe('mii_fighter')
    expect(officialFighterCode('mii-gunner')).toBe('mii_fighter')
  })
})
