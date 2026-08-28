import type { ProCharacterIndexedCoverageSet } from './proLabIndexedCoverageM73A'

const vod = (
  id: string,
  event: string,
  playerTag: string,
  opponentTag: string,
  fighterIds: readonly string[],
  date: string,
): ProCharacterIndexedCoverageSet => ({
  id: `m73-index-${id}`,
  title: `${event} - ${playerTag} vs ${opponentTag} [${fighterIds.join(', ')} character index]`,
  playerTag,
  playerFighterIds: [],
  opponentTag,
  opponentFighterIds: [],
  indexedFighterIds: fighterIds,
  date,
  sourceUrls: [
    `https://smasharchives.com/vod/${id}`,
    `https://www.youtube.com/watch?v=${id}`,
  ],
  evidenceStatus: 'source-index',
})

export const proIndexedCoverageM73C = [
  vod('pCSU5CrqSwY', 'SAO 5', 'Maple', 'Pictochat gf', ['mewtwo'], '2023-10-29'),
  vod('MbgJsnYtgnE', 'Sumapa 110 GRAND FINALS', 'Ken', 'Gorioka', ['mewtwo'], '2023-10-26'),
  vod('ctsD9AqU72o', 'Warhawk Weekly 3 Losers Quarters', 'Volt', 'CrazyAsent', ['mewtwo'], '2023-10-14'),
  vod('1xcehmg9JJo', 'S@X 528', 'Logic', 'TheTurtleKing', ['mewtwo'], '2023-10-13'),

  vod('1TuV6fCd9hs', 'USW 146 Winners Bracket', 'Lima', 'Shigura', ['chrom'], '2023-10-15'),
  vod('7Zki1iNjYJQ', 'USW 146', 'Shigura', 'Atomic', ['chrom'], '2023-10-15'),
  vod('ai_LcrAKg8g', 'USW 146', 'Shigura', 'Ados', ['chrom'], '2023-10-15'),
  vod('Ll_tzDuvTZg', 'Kagaribi 11', 'Yaura', 'rax', ['chrom'], '2023-10-09'),
  vod('gGXITgq9cMA', 'NTC Smash Open 7 Losers R4', 'Rainbow Road Trucker', 'Krys', ['chrom'], '2023-10-08'),

  vod('dfpyR2IvWKY', 'BDS Weekly 8 Winners Quarters', 'Delectron', 'T_Boi', ['king-dedede'], '2023-10-30'),
  vod('nVraMbs3IA8', 'Cream City Clash 108 Losers Finals', 'Sophist', 'Kaiju', ['king-dedede'], '2023-10-23'),
  vod('n4AlMlsZtP8', 'Cream City Clash 108 Losers Quarters', 'Sophist', 'Cal', ['king-dedede'], '2023-10-23'),
  vod('IvGcx3A5hp4', 'Cream City Clash 108 Winners Semis', 'Eyas', 'Sophist', ['king-dedede'], '2023-10-23'),

  vod('O-rpF01_t-I', 'Wolfpack Mashers 8 Winners Finals', 'Jeoff', 'D-Money', ['incineroar'], '2023-10-30'),
  vod('W8CVbM4jJz0', 'Wolfpack Mashers 8 Winners Semis', 'Untitled', 'D-Money', ['incineroar'], '2023-10-30'),
  vod('Mb6tAKF-cB4', 'Wolfpack Mashers 8 Winners R2', 'BABOONGA', 'Verde', ['incineroar'], '2023-10-30'),

  vod('jXKkieMSAAA', 'BDS Weekly 8 Winners Semis', 'Delectron', 'IvUsaur', ['piranha-plant'], '2023-10-30'),
  vod('ZhqAkjdBxAY', 'Warhawk Weekly 4 Winners R1', 'Forgurble', 'AngryDog', ['piranha-plant'], '2023-10-30'),
  vod('kYpwBQL9ibY', 'Cream City Clash 108 Losers Quarters', 'TheDood22', 'Dark Sriracha', ['piranha-plant', 'marth'], '2023-10-23'),
  vod('9672YQRxqfM', 'Cream City Clash 108 Winners Quarters', 'Dark Sriracha', 'Sophist', ['piranha-plant'], '2023-10-23'),
] as const satisfies readonly ProCharacterIndexedCoverageSet[]
