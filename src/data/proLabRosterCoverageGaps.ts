import type { ProPlayerRepresentative } from './proLabTypes'

/**
 * Representatives added from objective full-roster coverage gaps. Entries here
 * are not priority characters; they exist only because the neutral coverage
 * audit found a fighter without enough representative evidence.
 */
export const proCoverageGapRepresentatives = [
  {
    id: 't-link',
    tag: 'T',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'link', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:T',
      'https://smasharchives.com/vod/KSfwiboZjaw',
    ],
    note: 'Historically elite Link specialist with documented tournament participation through DELTA x Seibugeki Open in April 2026. The currently cataloged direct VOD is legacy-era evidence and is not treated as proof of current-meta tactics.',
  },
  {
    id: 'toriguri',
    tag: 'Toriguri',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'banjo-and-kazooie', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Toriguri',
      'https://www.youtube.com/watch?v=-aEcBEQjAiU',
    ],
    note: 'Current Banjo & Kazooie specialist with a documented UltRank Half Year 2026 ranking. Added only after the neutral audit found Banjo & Kazooie at zero VODs.',
  },
  {
    id: 'tsumusuto',
    tag: 'Tsumusuto',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'dr-mario', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Tsumusuto',
      'https://www.youtube.com/watch?v=Ty1sUtrXTO4',
    ],
    note: 'Long-running Dr. Mario specialist with documented major Top 8 results. The gap-fill VOD is 2022 footage and remains era-labeled rather than treated as current-meta proof.',
  },
  {
    id: 'bassmage',
    tag: 'BassMage',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'jigglypuff', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:BassMage',
      'https://www.youtube.com/watch?v=CIb10iRx3W4',
    ],
    note: 'Active Jigglypuff specialist with documented 2026 tournament results and an UltRank Half Year 2026 placement.',
  },
  {
    id: 'regalo',
    tag: 'Regalo',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'lucas', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Regalo',
      'https://liquipedia.net/smash/Regalo',
      'https://www.youtube.com/watch?v=ikpL25GDB-8',
    ],
    note: 'Lucas specialist whose Super Smash Con 2022 run reached 9th at a 2,388-player event. Added only because Lucas had zero cataloged Pro Lab VODs.',
  },
  {
    id: 'dabuz',
    tag: 'Dabuz',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'rosalina-and-luma', role: 'main' },
      { fighterId: 'olimar', role: 'secondary' },
      { fighterId: 'min-min', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Dabuz',
      'https://www.youtube.com/watch?v=1JGQziImwBQ',
    ],
    note: 'Long-running elite Rosalina & Luma representative with a documented UltRank 2025 ranking. Secondary roles are retained only as documented roles, not promoted from individual counterpicks.',
  },
  {
    id: 'rickles',
    tag: 'Rickles',
    country: 'United States',
    region: 'North America',
    status: 'legacy',
    characterRoles: [{ fighterId: 'ganondorf', role: 'main', activeTo: '2023' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Rickles',
      'https://liquipedia.net/smash/Rickles',
      'https://smasharchives.com/vod/uNOkET2lX_8',
    ],
    note: 'Retired Ganondorf specialist retained only as legacy-era coverage. His footage is not treated as evidence of the current 2026 metagame.',
  },
  {
    id: 'zaki',
    tag: 'ZAKI',
    country: 'Japan',
    region: 'Japan',
    status: 'legacy',
    characterRoles: [{ fighterId: 'king-dedede', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:ZAKI',
      'https://smasharchives.com/vod/ZLmZlIrgLho',
    ],
    note: 'Historically definitive King Dedede specialist. The cataloged gap-fill set is 2020 online-era footage and is retained as legacy evidence only.',
  },
  {
    id: 'wadi',
    tag: 'WaDi',
    country: 'United States',
    region: 'North America',
    status: 'legacy',
    characterRoles: [
      { fighterId: 'mewtwo', role: 'co-main' },
      { fighterId: 'rob', role: 'co-main' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:WaDi',
      'https://smasharchives.com/vod/EjIAAJ5rg8Q',
    ],
    note: 'Retired R.O.B./Mewtwo co-main retained as legacy evidence. SmashWiki documents WaDi as one of Ultimate Mewtwo’s historically strongest representatives.',
  },
  {
    id: 'capitancito',
    tag: 'Capitancito',
    country: 'Dominican Republic',
    region: 'North America',
    status: 'legacy',
    characterRoles: [{ fighterId: 'mii-gunner', role: 'main', activeTo: '2025' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Capitancito',
      'https://smasharchives.com/vod/QnY4vfWJwEM',
    ],
    note: 'Top historical Mii Gunner specialist with documented major results through 2025. No 2026 activity is inferred.',
  },
  {
    id: 'trigger-simon',
    tag: 'TRIGGER',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'simon', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:TRIGGER',
      'https://liquipedia.net/smash/TRIGGER',
    ],
    note: 'Current Japanese Simon specialist with documented 2026 offline results. A direct full-set VOD remains required before Simon leaves the zero-VOD backlog.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
