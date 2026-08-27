import type { ProPlayerRepresentative } from './proLabTypes'

/**
 * Representatives added for the bulk-acquisition pass. These roles come from
 * current player/tournament sources and intentionally make no tactical claims.
 */
export const proPlayerRepresentatives2026Batch4 = [
  {
    id: 'apollokage',
    tag: 'ApolloKage',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'snake', role: 'main' },
      { fighterId: 'steve', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:ApolloKage',
      'https://www.ssbwiki.com/Tournament:S_Factor_X3',
    ],
    note: 'Current North American Snake specialist with active 2026 major/supermajor footage; Steve remains a documented secondary.',
  },
  {
    id: 'wrath',
    tag: 'Wrath',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'sonic', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Wrath',
      'https://liquipedia.net/smash/Patchwork/2026',
    ],
    note: 'Ranked in UltRank Half Year 2026 and retained as a second current Sonic representative alongside Sonix/KEN evidence.',
  },
  {
    id: 'dany',
    tag: 'Dany',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'wolf', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Dany2theny',
      'https://liquipedia.net/smash/Patchwork/2026',
    ],
    note: 'Current Wolf specialist ranked in UltRank Half Year 2026 with a top-six Patchwork 2026 finish.',
  },
  {
    id: 'luis',
    tag: 'Lui$',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'palutena', role: 'main' },
      { fighterId: 'rob', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Lui%24',
      'https://liquipedia.net/smash/Patchwork/2026',
    ],
    note: 'Current globally ranked Palutena representative; R.O.B. is retained only where source-backed set metadata confirms it.',
  },
  {
    id: 'elijmin',
    tag: 'elijmin',
    country: 'Canada',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'shulk', role: 'main' },
      { fighterId: 'mii-gunner', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Elijmin',
      'https://liquipedia.net/smash/Patchwork/2026',
    ],
    note: 'UltRank Half Year 2026 Shulk representative currently based in Texas; Mii Gunner remains a documented secondary.',
  },
  {
    id: 'beastly',
    tag: 'Beastly',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'diddy-kong', role: 'main' },
      { fighterId: 'ness', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Beastly',
      'https://liquipedia.net/smash/Patchwork/2026',
    ],
    note: 'Texas Diddy Kong specialist with current 2026 major/superregional footage; Ness remains a documented secondary.',
  },
  {
    id: 'lima',
    tag: 'Lima',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'bayonetta', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Lima',
      'https://www.ssbwiki.com/Tournament:Comicpalooza_Fight_Club_2026',
    ],
    note: 'Current globally ranked Bayonetta representative with deep 2026 Comicpalooza, Patchwork, and S Factor runs.',
  },
  {
    id: 'waka',
    tag: 'WaKa',
    country: 'Mexico',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'luigi', role: 'main' },
      { fighterId: 'rob', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:WaKa',
      'https://www.ssbwiki.com/Tournament:S_Factor_X3',
    ],
    note: 'Current Mexican Luigi specialist and 2026 ranked representative; R.O.B. remains a documented secondary.',
  },
  {
    id: 'jakarot',
    tag: 'Jakarot',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'hero', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Jakarot',
      'https://www.ssbwiki.com/Tournament:Comicpalooza_Fight_Club_2026',
    ],
    note: 'Houston Hero specialist with current 2026 tournament footage, added as another Hero evidence source rather than a style claim.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
