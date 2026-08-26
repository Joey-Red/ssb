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
    sourceUrls: ['https://liquipedia.net/smash/Hero_%28Japanese_player%29'],
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
  {
    id: 'acola',
    tag: 'acola',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'steve', role: 'main' },
      { fighterId: 'mr-game-and-watch', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:acola',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current top-ranked 2026 representative for Steve; Mr. Game & Watch is retained only as a documented secondary.',
  },
  {
    id: 'doramigi',
    tag: 'Doramigi',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'min-min', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Doramigi',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite Min Min specialist and 2026 top-two global representative.',
  },
  {
    id: 'hurt',
    tag: 'Hurt',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'snake', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Hurt',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite Snake specialist with repeated major wins and deep international runs.',
  },
  {
    id: 'sonix',
    tag: 'Sonix',
    country: 'Dominican Republic',
    region: 'Caribbean',
    status: 'active',
    characterRoles: [{ fighterId: 'sonic', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Sonix',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite Sonic specialist and GENESIS X3 champion.',
  },
  {
    id: 'zomba',
    tag: 'Zomba',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'rob', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Zomba',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite R.O.B. representative with a top-five 2026 half-year ranking.',
  },
  {
    id: 'miya',
    tag: 'Miya',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'mr-game-and-watch', role: 'main' },
      { fighterId: 'steve', role: 'secondary' },
      { fighterId: 'rob', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Miya_(Honshu)',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Elite Mr. Game & Watch representative; secondary roles are recorded without treating them as equivalent to his main.',
  },
  {
    id: 'peabnut',
    tag: 'Peabnut',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'mega-man', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Peabnut',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current top-ten 2026 Mega Man specialist and major champion.',
  },
  {
    id: 'mkleo',
    tag: 'MkLeo',
    country: 'Mexico',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'joker', role: 'main' },
      { fighterId: 'pyra', role: 'secondary' },
      { fighterId: 'mythra', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:MkLeo',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current Joker representative with documented 2026 Aegis usage; historical characters are not promoted into current roles here.',
  },
  {
    id: 'asimo',
    tag: 'Asimo',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'ryu', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Asimo',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite Ryu specialist and the strongest provenance-backed Ryu candidate for Pro Lab.',
  },
  {
    id: 'raru',
    tag: 'Raru',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'luigi', role: 'main' },
      { fighterId: 'min-min', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Raru',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current elite Luigi specialist; Min Min is retained as a documented secondary rather than inferred from isolated counterpicks.',
  },
  {
    id: 'tweek',
    tag: 'Tweek',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'diddy-kong', role: 'main' },
      { fighterId: 'sephiroth', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Tweek',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Long-running elite Diddy Kong representative with a documented Sephiroth secondary.',
  },
  {
    id: 'yoshidora',
    tag: 'Yoshidora',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'yoshi', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Yoshidora',
      'https://www.ssbwiki.com/UltRank_2025',
    ],
    note: 'Established Yoshi specialist and major winner retained as a high-confidence Yoshi research representative.',
  },
  {
    id: 'shinymark',
    tag: 'ShinyMark',
    country: 'Guatemala',
    region: 'Central America',
    status: 'active',
    characterRoles: [{ fighterId: 'pikachu', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:ShinyMark',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Leading post-pandemic Pikachu representative with a documented supermajor win.',
  },
  {
    id: 'ken-sonic',
    tag: 'KEN',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'sonic', role: 'main' },
      { fighterId: 'sephiroth', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:KEN',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Veteran Sonic representative with a documented Sephiroth secondary, useful for cross-player Sonic comparison.',
  },
  {
    id: 'glutonny',
    tag: 'Glutonny',
    country: 'France',
    region: 'Europe',
    status: 'active',
    characterRoles: [{ fighterId: 'wario', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Glutonny',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Long-running elite Wario specialist and current ranked European representative.',
  },
  {
    id: 'sin-icies',
    tag: 'Sin',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'ice-climbers', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Sin_(Ultimate)',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current Ice Climbers specialist used to seed an otherwise sparse high-level character corpus.',
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
        ? ['Representative candidates are provenance-backed; VOD-level character usage must still be confirmed per set.']
        : ['Representative selection remains queued rather than guessed; sparse characters should be researched from current ranking and tournament evidence.'],
  }
})

export function getProRepresentativesForFighter(fighterId: string) {
  const ids = new Set(representativesForFighter(fighterId))
  return proPlayerRepresentatives.filter((player) => ids.has(player.id))
}
