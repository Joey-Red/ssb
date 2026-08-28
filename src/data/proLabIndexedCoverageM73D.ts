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

/**
 * Pair-efficient closeout of the M73 severe-deficit queue. Every fighter label,
 * player pairing, event label, source-date anchor, and YouTube ID is preserved
 * from the linked public Smasharchives record. The rows remain side-neutral
 * acquisition evidence and do not claim direct-watch review or tactical facts.
 */
export const proIndexedCoverageM73D = [
  vod('d6d1qqCzAzw', 'Warmup Wednesdays 8 Round Robin', 'Duds', 'Ezu', ['dr-mario', 'falco', 'sora'], '2021-10-23'),
  vod('saQjTnxJqCk', 'West Towne Brawl 67 Winners R2', 'Peels', 'Riflip', ['dr-mario', 'zero-suit-samus'], '2023-10-08'),
  vod('Ebghhah5EE8', 'Seikatsu Skirmish #6', 'Axis', 'Bbone', ['dr-mario', 'isabelle'], '2022-02-16'),
  vod('PlvjmGys594', 'MSM 181', 'Strategist', 'Spanky', ['dr-mario', 'squirtle', 'ivysaur', 'charizard'], '2019-03-22'),
  vod('y7ikjim7eEA', 'Zone 33', 'Winners Round 3 - Yiazmat Goat', 'Leflemar', ['dr-mario', 'byleth', 'piranha-plant'], '2023-05-31'),

  vod('ljAs3SB4i2E', 'Glitch Konami Code', 'MkLeo', 'Kain', ['simon', 'byleth'], '2021-09-26'),
  vod('OWuBbRNGl6U', 'Smash Ultimate', 'Blackbird', 'Radiant Guts', ['simon', 'inkling', 'ike'], '2020-01-18'),
  vod('cfFJjP2HXok', 'Game Underground Winners Quarters', 'Practicalities', 'Satoru', ['simon', 'sephiroth'], '2021-12-24'),
  vod('c0VO3b5C59E', 'The Lab #109', 'Burning', 'Dyna', ['simon', 'duck-hunt', 'shulk'], '2021-08-09'),
  vod('-OUexh_rZq4', 'DAT MM SE', 'wojehfan18', 'RobbieAK47', ['simon', 'terry', 'meta-knight'], '2023-08-29'),

  vod('99-2zdB0UJo', 'Edge Guard 103 Losers R1', 'Cosmic', 'CrayZ', ['bowser-jr', 'ike'], '2023-08-01'),
  vod('MBi7WE7fzws', 'BDS Weekly 2 Winners Semis', 'Bowserdude', 'DDude', ['bowser-jr', 'ike'], '2023-02-08'),
  vod('ranVz-avzMQ', 'Phantasm 73 Losers R2', 'Cosmic', 'Battler', ['bowser-jr', 'ike'], '2022-12-07'),
  vod('IZtM-wNbePk', 'Smash Realm #15', 'Baryon', 'Josh', ['bowser-jr', 'byleth'], '2022-03-26'),

  vod('Jr7cJIoZZuA', 'Game On Expo Friday Finals', 'Sockem16', 'Maruko', ['toon-link', 'lucas'], '2023-08-15'),
  vod('3E3E7j1Rty8', 'Knockdown 83', 'STAR', 'Marvelous_Marco', ['toon-link', 'lucas'], '2023-07-22'),
  vod('5nv6Z9e_QFo', 'S@X 516', 'Waddle DJ', 'Sprinkle', ['toon-link', 'lucas'], '2023-07-20'),
  vod('AJNajuIhsCI', 'HAT 101', 'Marvelous_Marco', 'Nicko', ['toon-link', 'lucina'], '2020-03-01'),

  vod('KsKC0W-FgfM', 'Vulcan', 'Solo', 'Teminian', ['inkling', 'villager'], '2022-04-03'),
  vod('ieSkFyNlu9A', 'SL Ultimate #36', 'Chomo', 'Luffy', ['inkling', 'villager'], '2019-08-16'),
  vod('YnDFhe5f2JQ', 'TAMISUMA 173 GRAND FINALS', 'Kikuzakari', 'Rizeasu', ['villager', 'marth'], '2020-09-12'),
  vod('MECYdWvkKiE', 'Thursday Throwdown 17 Winners R1', 'Kwas', 'Puddles', ['squirtle', 'ivysaur', 'charizard', 'robin'], '2022-06-26'),
  vod('oa98U2F4bC4', 'Cream City Clash 6 Winners R1', 'Puddles', 'EtcNaut', ['robin', 'king-k-rool', 'sephiroth'], '2022-05-04'),

  vod('vtXFk8Z98JU', 'S@X 472', 'KingRoBo', 'Smooch', ['king-k-rool', 'sephiroth'], '2022-09-08'),
  vod('DY-jVq2iPJU', 'TAMISUMA 197 SSBU', 'Jaguchi', 'Kagura', ['marth', 'robin'], '2020-11-19'),
  vod('P4u4i-zOx_s', 'The Grind 157', 'Benji', 'Erin', ['lucina', 'mii-swordfighter'], '2021-10-12'),
  vod('uzipfYjZogg', 'S@X 473 Winners Quarters', 'Pink Fresh', 'GUMMY', ['sora', 'mii-swordfighter'], '2022-09-14'),
  vod('VJMzhtL7qo8', 'Warhawk Weekly 4 Losers R2', 'Forgurble', 'GameCario', ['king-k-rool', 'terry'], '2023-10-30'),
  vod('2xy816kehfg', 'Stone Ocean 7', 'CarvaGrease', 'Palo', ['sora', 'mii-swordfighter'], '2023-05-26'),
  vod('SUywEmxjC1I', 'Vortex Legends 26 Losers Semis', 'Kogarasuma', 'Bran', ['lucina'], '2022-12-02'),
] as const satisfies readonly ProCharacterIndexedCoverageSet[]
