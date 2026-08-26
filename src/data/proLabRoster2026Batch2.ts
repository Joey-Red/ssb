import type { ProPlayerRepresentative } from './proLabTypes'

/**
 * Additional 2026 representatives added alongside the second extensive VOD
 * acquisition batch. Roles are source-backed and intentionally describe only
 * documented character usage, not inferred player style or tactical intent.
 */
export const proPlayerRepresentatives2026Batch2 = [
  {
    id: 'beastmodepaul',
    tag: 'BeastModePaul',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'hero', role: 'main' },
      { fighterId: 'sephiroth', role: 'secondary' },
    ],
    sourceUrls: [
      'https://liquipedia.net/smash/BeastModePaul',
      'https://liquipedia.net/smash/MomoCon/2026',
    ],
    note: 'Current Hero specialist; MomoCon 2026 records a fourth-place major finish with Hero.',
  },
  {
    id: 'jahzz0',
    tag: 'Jahzz0',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'ryu', role: 'main' },
      { fighterId: 'ken', role: 'co-main' },
      { fighterId: 'kazuya', role: 'secondary' },
    ],
    sourceUrls: [
      'https://liquipedia.net/smash/Jahzz0',
      'https://liquipedia.net/smash/MomoCon/2026',
    ],
    note: 'Current shoto specialist; MomoCon 2026 records a fifth-place major finish using Ryu/Ken/Kazuya.',
  },
  {
    id: 'jakal',
    tag: 'Jakal',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'wolf', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Jakal',
      'https://liquipedia.net/smash/MomoCon/2026',
    ],
    note: 'Current Wolf specialist added as a second provenance-backed Wolf style sample alongside Ouch!?.',
  },
  {
    id: 'fatality',
    tag: 'Fatality',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [{ fighterId: 'captain-falcon', role: 'main' }],
    sourceUrls: [
      'https://liquipedia.net/smash/Fatality',
      'https://liquipedia.net/smash/MomoCon/2026',
    ],
    note: 'Long-running Captain Falcon specialist with current 2026 tournament footage retained as active evidence.',
  },
  {
    id: 'cosmos',
    tag: 'Cosmos',
    country: 'United States',
    region: 'North America',
    status: 'active',
    characterRoles: [
      { fighterId: 'pyra', role: 'main' },
      { fighterId: 'mythra', role: 'main' },
      { fighterId: 'inkling', role: 'secondary' },
    ],
    sourceUrls: [
      'https://liquipedia.net/smash/Cosmos',
      'https://liquipedia.net/smash/MomoCon/2026',
    ],
    note: 'Current Aegis representative added to broaden the existing Aegis study pool; documented Inkling remains a secondary.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
