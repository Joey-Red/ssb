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
] as const satisfies readonly ProPlayerRepresentative[]
