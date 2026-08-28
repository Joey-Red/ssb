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
    status: 'legacy',
    characterRoles: [{ fighterId: 'link', role: 'main' }],
    sourceUrls: [
      'https://www.ssbwiki.com/Smasher:T',
      'https://smasharchives.com/vod/KSfwiboZjaw',
    ],
    note: 'Historically elite Link specialist. Retained as legacy evidence so sparse modern Link coverage is not mislabeled as current-meta representation.',
  },
] as const satisfies readonly ProPlayerRepresentative[]
