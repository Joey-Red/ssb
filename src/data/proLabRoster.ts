import { roster } from './roster'
import type { ProFighterResearchEntry, ProPlayerRepresentative } from './proLabTypes'

export const proPlayerRepresentatives = [
  {
    id: 'shuton',
    tag: 'Shuton',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'pyra', role: 'co-main' },
      { fighterId: 'mythra', role: 'co-main' },
      { fighterId: 'olimar', role: 'co-main' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Shuton',
      'https://www.ssbwiki.com/LumiRank_2025',
    ],
    note: 'High-level Aegis/Olimar representative with current major-level tournament footage.',
  },
  {
    id: 'sparg0',
    tag: 'Sparg0',
    country: 'Mexico',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'cloud', role: 'main' },
      { fighterId: 'pyra', role: 'secondary' },
      { fighterId: 'mythra', role: 'secondary' },
    ],
    sourceUrls: [
      'https://liquipedia.net/smash/Sparg0',
      'https://www.ssbwiki.com/LumiRank_2025',
    ],
    note: 'Top-level player with documented recent Aegis tournament usage in addition to Cloud.',
  },
  {
    id: 'light',
    tag: 'Light',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'fox', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Light',
      'https://www.ssbwiki.com/LumiRank_2025',
    ],
    note: 'Long-running elite Fox representative with extensive major footage.',
  },
  {
    id: 'kaninabe',
    tag: 'Kaninabe',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'fox', role: 'main' }],
    sourceUrls: ['https://liquipedia.net/smash/Kaninabe'],
    note: 'Japanese Fox specialist used to avoid teaching one player style as the only Fox model.',
  },
  {
    id: 'sisqui',
    tag: 'Sisqui',
    country: 'Spain',
    region: 'Europe',
    status: 'active',
    characterRoles: [
      { fighterId: 'samus', role: 'main' },
      { fighterId: 'dark-samus', role: 'co-main' },
    ],
    sourceUrls: ['https://liquipedia.net/smash/Sisqui'],
    note: 'European Samus/Dark Samus specialist with sustained major-level results.',
  },
  {
    id: 'yaura',
    tag: 'Yaura',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'samus', role: 'main' },
      { fighterId: 'dark-samus', role: 'co-main' },
    ],
    sourceUrls: ['https://liquipedia.net/smash/Yaura'],
    note: 'Japanese Samus/Dark Samus specialist for cross-region playstyle comparison.',
  },
  {
    id: 'hero-jp',
    tag: 'Hero',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'bowser', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Hero_%28Japanese_player%29',
      'https://www.ssbwiki.com/Smasher://',
    ],
    note: 'Japanese Bowser specialist widely documented as a leading Bowser representative.',
  },
  {
    id: 'leon-bowser',
    tag: 'LeoN',
    country: 'United States',
    region: 'North America',
    status: 'legacy',
    characterRoles: [{ fighterId: 'bowser', role: 'main', activeTo: '2024' }],
    sourceUrls: ['https://liquipedia.net/smash/LeoN'],
    note: 'Legacy high-level Bowser footage retained as a separate era rather than mixed into current-meta conclusions.',
  },
  {
    id: 'muteace',
    tag: 'MuteAce',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'peach', role: 'main' }],
    sourceUrls: ['https://liquipedia.net/smash/MuteAce'],
    note: 'Elite Peach specialist with deep-bracket major footage.',
  },
  {
    id: 'umeki',
    tag: 'Umeki',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'daisy', role: 'main' },
      { fighterId: 'peach', role: 'secondary' },
    ],
    sourceUrls: ['https://liquipedia.net/smash/Umeki'],
    note: 'Daisy specialist who provides a second float-cancel style and a Japan-region comparison point.',
  },
] as const satisfies readonly ProPlayerRepresentative[]

export const proLabPilotFighterIds = ['pyra', 'mythra', 'fox', 'samus', 'dark-samus', 'bowser', 'peach', 'daisy'] as const

const representativesForFighter = (fighterId: string) =>
  proPlayerRepresentatives
    .filter((player) => player.characterRoles.some((role) => role.fighterId === fighterId))
    .map((player) => player.id)

export const proFighterResearchRegistry: readonly ProFighterResearchEntry[] = roster.map((fighter) => {
  const representativeIds = representativesForFighter(fighter.id)
  return {
    fighterId: fighter.id,
    status: representativeIds.length > 0 ? 'seeded' : 'research-queued',
    representativeIds,
    researchNotes:
      representativeIds.length > 0
        ? ['Initial representative candidates are provenance-backed; VOD-level character usage must still be confirmed per set.']
        : ['Representative selection is intentionally queued for the full-roster M89 expansion rather than guessed.'],
  }
})

export function getProRepresentativesForFighter(fighterId: string) {
  const ids = new Set(representativesForFighter(fighterId))
  return proPlayerRepresentatives.filter((player) => ids.has(player.id))
}
