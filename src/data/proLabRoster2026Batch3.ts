import type { ProPlayerRepresentative } from './proLabTypes'

/**
 * Thin-character representatives for the third extensive Pro Lab acquisition
 * batch. Character roles are source-backed; no tactical style or intent is
 * inferred from rankings, bracket metadata, or VOD titles.
 */
export const proPlayerRepresentatives2026Batch3 = [
  {
    id: 'kirb0',
    tag: 'Kirb0',
    country: 'Scotland',
    region: 'Europe',
    status: 'active',
    characterRoles: [
      { fighterId: 'kirby', role: 'main' },
      { fighterId: 'mario', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Kirb0',
      'https://www.ssbwiki.com/Tournament:No_Tech_Zone_2026',
    ],
    note: 'Active European Kirby specialist with repeated 2026 offline results, including fifth at No Tech Zone 2026.',
  },
  {
    id: 'peanut',
    tag: 'Peanut',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'little-mac', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Peanut',
      'https://liquipedia.net/smash/Peanut',
    ],
    note: 'Long-running Little Mac specialist retained as a provenance-backed representative with 2026 offline competition.',
  },
  {
    id: 'lucky-mn',
    tag: 'Lucky',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'piranha-plant', role: 'main' },
      { fighterId: 'king-k-rool', role: 'secondary' },
      { fighterId: 'inkling', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Lucky_(Minnesota)',
      'https://liquipedia.net/smash/Minnesota_Power_Rankings/Ultimate',
    ],
    note: 'Minnesota Piranha Plant specialist. The explicit lucky-mn id prevents confusion with other competitive players using the Lucky tag.',
  },
  {
    id: 'tux',
    tag: 'Tux',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'meta-knight', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Tux',
      'https://www.ssbwiki.com/Tournament:LVL_UP_EXPO_2026',
    ],
    note: 'Las Vegas Meta Knight specialist with current 2026 tournament evidence; former Luigi use is not promoted into the current role list.',
  },
  {
    id: 'furararamen',
    tag: 'Furararamen',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'isabelle', role: 'main' },
      { fighterId: 'mr-game-and-watch', role: 'co-main' },
      { fighterId: 'wii-fit-trainer', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Furararamen',
      'https://liquipedia.net/smash/Furararamen',
    ],
    note: 'Current Japanese Isabelle/Game & Watch representative ranked in the 2026 global season; Wii Fit Trainer remains a documented secondary.',
  },
  {
    id: 'kikuzakari',
    tag: 'Kikuzakari',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [{ fighterId: 'villager', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Kikuzakari',
      'https://smashmate.net/fighter/villager/',
    ],
    note: 'Japanese Villager specialist retained to seed a sparse character library with current competitive evidence.',
  },
  {
    id: 'peppino',
    tag: 'Peppino',
    country: 'Italy',
    region: 'Europe',
    status: 'active',
    characterRoles: [{ fighterId: 'robin', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Italy_Power_Rankings/Ultimate',
      'https://www.ssbwiki.com/Tournament:No_Tech_Zone_2026',
    ],
    note: 'Italian Robin representative; ranking history plus current No Tech Zone footage support the role without inferring tactics.',
  },
  {
    id: 'lancelot',
    tag: 'Lancelot',
    country: 'Finland',
    region: 'Europe',
    status: 'active',
    characterRoles: [
      { fighterId: 'roy', role: 'main' },
      { fighterId: 'chrom', role: 'co-main' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Lancelot',
      'https://liquipedia.net/smash/Finland_Power_Rankings/Ultimate',
    ],
    note: 'Finland number-one Roy/Chrom representative with current 2026 international tournament activity.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
