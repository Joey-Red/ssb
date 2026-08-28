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

export const proIndexedCoverageM73B = [
  vod('rmYclelg2ig', 'Wolfpack Mashers 8 Losers R3', 'CrazyAsent', 'fae', ['jigglypuff'], '2023-10-30'),
  vod('z72tdUz5wlg', 'Wolfpack Mashers 8 Winners R2', 'lyanne!', 'fae', ['jigglypuff'], '2023-10-30'),
  vod('yMPT1SrLTyg', 'LMM Miami 2023', 'Hockey', 'Klaatu', ['jigglypuff'], '2023-10-29'),
  vod('FJQfnZYz5GE', 'S@X 530', 'Nicon', 'Slacker', ['jigglypuff'], '2023-10-26'),

  vod('YlEX2yhnpZg', 'Save Room 3 Winners R2', 'PacSmash', 'RubyD', ['dark-pit'], '2023-10-30'),
  vod('c90HorR-6i4', 'Sumapa 108', 'Horokeu', 'Skylock', ['dark-pit'], '2023-10-19'),
  vod('Q1T_oKKQUWs', 'BDS Weekly 6 Losers Finals', 'StudentX', 'Weef', ['dark-pit'], '2023-10-15'),
  vod('8Lmeu14Ew2o', 'BDS Weekly 6 Losers Semis', 'StudentX', 'Dave2006', ['dark-pit'], '2023-10-15'),
  vod('G9_AQSkePck', 'BDS Weekly 6 Losers Quarters', 'StudentX', 'FlyingBoy', ['dark-pit'], '2023-10-15'),

  vod('TPANOaKKY5M', 'LMM Miami 2023 Losers Semis', 'Dabuz', 'Shadic', ['rosalina-and-luma', 'corrin'], '2023-10-30'),
  vod('_7lpovKEp4k', 'West Towne Brawl 70 Winners R2', 'Peels', 'Astigmatism', ['corrin'], '2023-10-30'),
  vod('84I04MbXmII', 'LMM Miami 2023 Top 8', 'Kola', 'Shadic', ['corrin'], '2023-10-30'),
  vod('uu8Mdy_8znA', 'LMM Miami 2023 Top 8', 'Zomba', 'Shadic', ['corrin'], '2023-10-30'),
  vod('Uk6v-rWLsiY', 'LMM Miami 2023', 'Shadic', 'Riddles', ['corrin'], '2023-10-29'),

  vod('d2pcSjNkl20', 'LMM Miami 2023 Losers Finals', 'Spargo', 'Dabuz', ['rosalina-and-luma'], '2023-10-30'),
  vod('JSN68i4XA7w', 'Warhawk Weekly 4 Losers R4', 'CrazyAsent', 'Binch', ['rosalina-and-luma'], '2023-10-30'),
  vod('nDRjHXsBFhU', 'Warhawk Weekly 4 Losers R3', 'Forgurble', 'Binch', ['rosalina-and-luma'], '2023-10-30'),
  vod('7Y3PffzY7rg', 'Warhawk Weekly 4 Winners R3', 'NV', 'Binch', ['rosalina-and-luma'], '2023-10-30'),

  vod('bsy5zazz4k0', 'Sumapa 110 Losers Finals', 'Gorioka', 'TG', ['banjo-and-kazooie'], '2023-10-26'),
  vod('ywn-37xB_mQ', 'Sumapa 110 Losers Semis', 'Chicken', 'TG', ['banjo-and-kazooie'], '2023-10-26'),
  vod('iJrif5RAMkU', 'Sumapa 110 Top 8', 'TG', 'Kinaji', ['banjo-and-kazooie'], '2023-10-26'),
  vod('i_G6cCeqpqI', 'Sumapa 110', 'TG', 'Rizeasu', ['banjo-and-kazooie'], '2023-10-26'),
  vod('vCSKM6zoyVk', 'Sunday Night Fights 27 Grand Finals', 'Kaden', 'PowPow', ['banjo-and-kazooie'], '2023-10-23'),
] as const satisfies readonly ProCharacterIndexedCoverageSet[]
