import { proFighterResearchRegistry } from './proLabRoster'

export interface ProMetaRepresentationEntry {
  readonly rank: number
  readonly fighterIds: readonly string[]
  readonly label: string
  readonly representationPercent: number
  readonly sourceUrl: string
}

/**
 * UltRank Half Year 2026 character representation is based on qualifying game
 * wins in the ranking period, not a tier list. Combined roster entries are kept
 * combined here where the source publishes them together.
 */
export const proMetaRepresentation2026 = [
  { rank: 1, fighterIds: ['steve'], label: 'Steve', representationPercent: 6.15 },
  { rank: 2, fighterIds: ['rob'], label: 'R.O.B.', representationPercent: 5.46 },
  { rank: 3, fighterIds: ['kazuya'], label: 'Kazuya', representationPercent: 4.09 },
  { rank: 4, fighterIds: ['palutena'], label: 'Palutena', representationPercent: 3.08 },
  { rank: 5, fighterIds: ['pyra', 'mythra'], label: 'Pyra / Mythra', representationPercent: 2.79 },
  { rank: 6, fighterIds: ['sonic'], label: 'Sonic', representationPercent: 2.72 },
  { rank: 7, fighterIds: ['snake'], label: 'Snake', representationPercent: 2.69 },
  { rank: 8, fighterIds: ['mr-game-and-watch'], label: 'Mr. Game & Watch', representationPercent: 2.69 },
  { rank: 9, fighterIds: ['mii-brawler'], label: 'Mii Brawler', representationPercent: 2.69 },
  { rank: 10, fighterIds: ['cloud'], label: 'Cloud', representationPercent: 2.4 },
  { rank: 11, fighterIds: ['joker'], label: 'Joker', representationPercent: 2.2 },
  { rank: 12, fighterIds: ['fox'], label: 'Fox', representationPercent: 2.09 },
  { rank: 13, fighterIds: ['roy'], label: 'Roy', representationPercent: 2.07 },
  { rank: 14, fighterIds: ['falco'], label: 'Falco', representationPercent: 2.04 },
  { rank: 15, fighterIds: ['mario'], label: 'Mario', representationPercent: 1.97 },
  { rank: 16, fighterIds: ['greninja'], label: 'Greninja', representationPercent: 1.94 },
  { rank: 17, fighterIds: ['luigi'], label: 'Luigi', representationPercent: 1.94 },
  { rank: 18, fighterIds: ['diddy-kong'], label: 'Diddy Kong', representationPercent: 1.94 },
  { rank: 19, fighterIds: ['samus', 'dark-samus'], label: 'Samus / Dark Samus', representationPercent: 1.84 },
  { rank: 20, fighterIds: ['ryu'], label: 'Ryu', representationPercent: 1.71 },
  { rank: 21, fighterIds: ['min-min'], label: 'Min Min', representationPercent: 1.71 },
  { rank: 22, fighterIds: ['wolf'], label: 'Wolf', representationPercent: 1.6 },
  { rank: 23, fighterIds: ['donkey-kong'], label: 'Donkey Kong', representationPercent: 1.58 },
  { rank: 24, fighterIds: ['hero'], label: 'Hero', representationPercent: 1.55 },
  { rank: 25, fighterIds: ['ice-climbers'], label: 'Ice Climbers', representationPercent: 1.47 },
  { rank: 26, fighterIds: ['olimar'], label: 'Olimar', representationPercent: 1.42 },
  { rank: 27, fighterIds: ['yoshi'], label: 'Yoshi', representationPercent: 1.4 },
  { rank: 28, fighterIds: ['ness'], label: 'Ness', representationPercent: 1.37 },
].map((entry) => ({
  ...entry,
  sourceUrl: 'https://www.ssbwiki.com/UltRank_Half_Year_2026',
})) as readonly ProMetaRepresentationEntry[]

const researchByFighter = new Map(proFighterResearchRegistry.map((entry) => [entry.fighterId, entry]))

export const proMetaResearchPriorities2026 = proMetaRepresentation2026.map((entry) => {
  const fighterStates = entry.fighterIds.map((fighterId) => researchByFighter.get(fighterId)?.status ?? 'research-queued')
  const representativeIds = entry.fighterIds.flatMap(
    (fighterId) => researchByFighter.get(fighterId)?.representativeIds ?? [],
  )
  return {
    ...entry,
    researchStatus: fighterStates.every((status) => status === 'seeded') ? 'seeded' : 'needs-representative',
    representativeIds: [...new Set(representativeIds)],
  } as const
})

export const nextProMetaResearchTargets2026 = proMetaResearchPriorities2026.filter(
  (entry) => entry.researchStatus === 'needs-representative',
)
