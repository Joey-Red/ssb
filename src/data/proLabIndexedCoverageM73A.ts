import type { ProIndexedCoverageSet } from './proLabIndexedCoverageDepth'

export type ProCharacterIndexedCoverageSet = ProIndexedCoverageSet & {
  readonly indexedFighterIds: readonly string[]
}

const vod = (
  id: string,
  event: string,
  playerTag: string,
  opponentTag: string,
  fighterId: string,
  date: string,
): ProCharacterIndexedCoverageSet => ({
  id: `m73-index-${id}`,
  title: `${event} - ${playerTag} vs ${opponentTag} [${fighterId} character index]`,
  playerTag,
  playerFighterIds: [],
  opponentTag,
  opponentFighterIds: [],
  indexedFighterIds: [fighterId],
  date,
  sourceUrls: [
    `https://smasharchives.com/vod/${id}`,
    `https://www.youtube.com/watch?v=${id}`,
  ],
  evidenceStatus: 'source-index',
})

/**
 * Character-index-only evidence. Smasharchives explicitly catalogs each row
 * under the named fighter, but these records do not infer which side used that
 * fighter unless an individual title establishes it. They deepen planning only
 * and never count as watched/reviewed gameplay.
 */
export const proIndexedCoverageM73A = [
  vod('r_Rn7jyQ4Y4', 'Wolfpack Mashers 8 Losers Finals', 'D-Money', 'Kaden', 'sheik', '2023-10-30'),
  vod('aCn5T2iLkq8', 'Warhawk Weekly 4 Winners Semis', 'Fatalis', 'gray', 'sheik', '2023-10-30'),
  vod('HkAYz53gGUA', 'Warhawk Weekly 4 Winners Quarters', 'Fatalis', 'Quag', 'sheik', '2023-10-30'),
  vod('VFg55YyrfJQ', 'West Towne Brawl 70 Losers R4', 'Peels', 'Mario', 'sheik', '2023-10-30'),
  vod('ShWef8JEFys', 'West Towne Brawl 70 Losers R3', 'Peels', 'Mazen', 'sheik', '2023-10-30'),

  vod('IhhNvOXRZzY', 'Warhawk Weekly 4 Winners Finals', 'Fatalis', 'PacSmash', 'pit', '2023-10-30'),
  vod('PTX5XSYWrPE', 'Warhawk Weekly 4 Winners Semis', 'NV', 'PacSmash', 'pit', '2023-10-30'),
  vod('dmjW1oXdP7E', 'Ult Singles In Your Area 75 Losers Quarters', 'Kenyon', 'Escaped', 'pit', '2023-10-30'),
  vod('7OgsSoSi6-E', 'Ult Singles In Your Area 75 Losers Top 8', 'Kenyon', 'Crandulf', 'pit', '2023-10-30'),
  vod('eLPyIkEi2ow', 'Ult Singles In Your Area 75 Losers R2', 'Kenyon', 'Salami', 'pit', '2023-10-30'),

  vod('vvfky_pA_SU', 'DAT MM 290', 'BIG:MARN', 'Matilda', 'ganondorf', '2023-10-25'),
  vod('q8FDo_IV-EA', 'Smash Sur Mer Weekly #113', 'Necross', 'Actylo', 'ganondorf', '2023-10-24'),
  vod('52HILJkvYjE', 'Sunday Night Fights #26 Winners R1', 'LOWTIERGAWD', 'Melo', 'ganondorf', '2023-10-22'),
  vod('v3WJc0MRqbU', 'DAT MM 289', 'Matt', 'BIG:MARN', 'ganondorf', '2023-10-20'),
  vod('Osj2OKAwW70', 'The Grind 252', 'Rising', 'Combofreak', 'ganondorf', '2023-10-14'),

  vod('eR7l7C6Too4', 'LMM Miami 2023', 'MkLeo', 'Vivi', 'lucario', '2023-10-29'),
  vod('sULfl6cA-jQ', 'The Grind 253', 'Quinn', 'Idwn', 'lucario', '2023-10-24'),
  vod('kuAg8i4Nr8M', 'USW 177', 'Kazma', 'Beastly', 'lucario', '2023-10-19'),
  vod('kpzLXA4Pq_w', 'Failsafe Fall 2023 Top 8', 'Vivi', 'MPG', 'lucario', '2023-10-16'),
  vod('OydDJ8v18zQ', 'Failsafe Fall 2023 Top 8', 'Vivi', 'Syrup', 'lucario', '2023-10-16'),
] as const satisfies readonly ProCharacterIndexedCoverageSet[]
