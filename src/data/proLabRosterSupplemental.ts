import type { ProPlayerRepresentative } from './proLabTypes'

/**
 * Additional current representatives selected from source-backed 2026 ranking
 * data. These records expand character coverage without changing the historical
 * pilot registry or inferring character use from isolated sets.
 */
export const supplementalProPlayerRepresentatives = [
  {
    id: 'syrup',
    tag: 'Syrup',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'steve', role: 'main' },
      { fighterId: 'ness', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Syrup',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 16th for the first half of 2026; Steve main with documented frequent Ness use.',
  },
  {
    id: 'masa',
    tag: 'MASA',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'falco', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:MASA',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Current globally ranked Falco specialist used to seed Falco research coverage.',
  },
  {
    id: 'raflow',
    tag: 'Raflow',
    country: 'France',
    region: 'Europe',
    status: 'active',
    characterRoles: [
      { fighterId: 'palutena', role: 'main' },
      { fighterId: 'mr-game-and-watch', role: 'secondary' },
      { fighterId: 'samus', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Raflow',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 61st in the first half of 2026; Palutena main with documented Game & Watch and Samus secondaries.',
  },
  {
    id: 'ouch',
    tag: 'Ouch!?',
    country: 'Canada',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'wolf', role: 'main' },
      { fighterId: 'joker', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Ouch!%3F',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 41st in the first half of 2026 and a high-confidence current Wolf representative.',
  },
  {
    id: 'tea',
    tag: 'Tea',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'kazuya', role: 'co-main' },
      { fighterId: 'pac-man', role: 'co-main' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Tea',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 24th in the first half of 2026; source explicitly lists Kazuya and Pac-Man as Ultimate mains.',
  },
  {
    id: 'karaage',
    tag: 'Karaage',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'captain-falcon', role: 'main' },
      { fighterId: 'pyra', role: 'secondary' },
      { fighterId: 'mythra', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Karaage',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 27th in the first half of 2026; Captain Falcon main with documented Aegis usage.',
  },
  {
    id: 'snow-jp',
    tag: 'Snow',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'mario', role: 'main' },
      { fighterId: 'pyra', role: 'secondary' },
      { fighterId: 'mythra', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Snow_(Japan)',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 37th in the first half of 2026; Mario main with documented Aegis secondary.',
  },
  {
    id: 'raki',
    tag: 'Raki',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'kazuya', role: 'co-main' },
      { fighterId: 'steve', role: 'co-main' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Raki',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 26th in the first half of 2026; source explicitly lists Kazuya and Steve as Ultimate mains.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
