import type { ProPlayerRepresentative } from './proLabTypes'

/** Current representatives for the remaining top-28 UltRank 2026 representation gaps. */
export const proMetaGapRepresentatives = [
  {
    id: 'yopi',
    tag: 'Yopi',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'mii-brawler', role: 'main' },
      { fighterId: 'mii-swordfighter', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Yopi',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 83rd in the first half of 2026 and identified as Japan’s leading current Mii Brawler specialist.',
  },
  {
    id: 'kola',
    tag: 'Kola',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'roy', role: 'main' },
      { fighterId: 'cloud', role: 'secondary' },
      { fighterId: 'pyra', role: 'secondary' },
      { fighterId: 'mythra', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:SALTONE',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 39th in the first half of 2026; Roy remains the explicitly listed Ultimate main.',
  },
  {
    id: 'tarik',
    tag: 'Tarik',
    country: 'Germany',
    region: 'Europe',
    status: 'active',
    characterRoles: [{ fighterId: 'greninja', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Tarik',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 43rd in the first half of 2026 and a current Greninja main.',
  },
  {
    id: 'mild-na-ho',
    tag: 'Mild na H.O',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'donkey-kong', role: 'main' },
      { fighterId: 'mii-brawler', role: 'secondary' },
      { fighterId: 'bowser', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Mild_na_H.O',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 63rd in the first half of 2026 and a current Donkey Kong main.',
  },
  {
    id: 'akakikusu',
    tag: 'Akakikusu',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'hero', role: 'main' },
      { fighterId: 'sora', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Akakikusu',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 45th in the first half of 2026 and a long-running elite Hero specialist.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
