import type { ProPlayerRepresentative } from './proLabTypes'

/** Current representatives added during the fifth large Pro Lab acquisition pass. */
export const proPlayerRepresentatives2026Batch5 = [
  {
    id: 'reno-jp',
    tag: 'Reno',
    country: 'Japan',
    region: 'Japan',
    status: 'active',
    characterRoles: [
      { fighterId: 'byleth', role: 'co-main' },
      { fighterId: 'greninja', role: 'co-main' },
      { fighterId: 'sephiroth', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:Reno_(Japan)',
      'https://www.ssbwiki.com/UltRank_Half_Year_2026',
    ],
    note: 'Ranked 87th in UltRank Half Year 2026; Byleth and Greninja are listed mains and Sephiroth remains a documented other character.',
  },
  {
    id: 'alandiss',
    tag: 'AlanDiss',
    country: 'Mexico',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'snake', role: 'main' },
      { fighterId: 'kazuya', role: 'secondary' },
    ],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:AlanDiss',
      'https://liquipedia.net/smash/AlanDiss',
    ],
    note: 'Current Tijuana Snake specialist with active 2026 major footage; Kazuya is retained only as a documented secondary.',
  },
  {
    id: 'zawg',
    tag: 'zawg',
    country: 'Canada',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'duck-hunt', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/BIGDUCKHUNTFAN7000',
      'https://liquipedia.net/smash/Battle_of_BC/8/Ultimate',
    ],
    note: 'Current Canadian Duck Hunt specialist and Battle of BC 8 top-six finisher, added to deepen a sparse Duck Hunt study library.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
