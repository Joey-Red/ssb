export interface ProIndexedCoverageSet {
  readonly id: string
  readonly title: string
  readonly playerTag: string
  readonly playerFighterIds: readonly string[]
  readonly opponentTag: string
  readonly opponentFighterIds: readonly string[]
  readonly date: string
  readonly sourceUrls: readonly string[]
  readonly evidenceStatus: 'source-index'
}

const playerIndex = (tag: string) => `https://www.smash-tube.com/en/result?player1=${encodeURIComponent(tag)}`
const pairIndex = (player: string, opponent: string) =>
  `https://www.smash-tube.com/en/result?player1=${encodeURIComponent(player)}&player2=${encodeURIComponent(opponent)}`

type Seed = readonly [
  id: string,
  title: string,
  playerTag: string,
  playerFighterIds: readonly string[],
  opponentTag: string,
  opponentFighterIds: readonly string[],
  date: string,
]

const seeds: readonly Seed[] = [
  ['depth-chunkykong-andrewt', 'Riptide 2024 - ChunkyKong (Donkey Kong) vs AndrewT (Zero Suit Samus)', 'ChunkyKong', ['donkey-kong'], 'AndrewT', ['zero-suit-samus'], '2025-09-20'],
  ['depth-chunkykong-sparg0', "ChunkyKong (Donkey Kong) vs Sparg0 (Aegis) | 19 Sep '24", 'ChunkyKong', ['donkey-kong'], 'Sparg0', ['pyra', 'mythra'], '2025-06-11'],
  ['depth-mkleo-chunkykong-1', "MkLeo (Joker) vs ChunkyKong (Donkey Kong) | 20 Feb '25", 'MkLeo', ['joker'], 'ChunkyKong', ['donkey-kong'], '2025-03-22'],
  ['depth-chunkykong-jahzz0-1', "ChunkyKong (Donkey Kong) vs Jahzz0 (Ken) | 30 Dec '24", 'ChunkyKong', ['donkey-kong'], 'Jahzz0', ['ken'], '2025-02-19'],
  ['depth-chunkykong-lukewarm', "ChunkyKong (Donkey Kong) vs LukeWarm (King K. Rool) | 29 Jan '25", 'ChunkyKong', ['donkey-kong'], 'LukeWarm', ['king-k-rool'], '2025-02-19'],
  ['depth-mkleo-chunkykong-2', "MkLeo (Joker) vs ChunkyKong (Donkey Kong) | 21 Jan '25", 'MkLeo', ['joker'], 'ChunkyKong', ['donkey-kong'], '2025-02-19'],
  ['depth-tweek-chunkykong', 'LMBM 2025 - Tweek (Diddy Kong) vs ChunkyKong (Donkey Kong)', 'Tweek', ['diddy-kong'], 'ChunkyKong', ['donkey-kong'], '2025-01-05'],
  ['depth-chunkykong-ridley', "ChunkyKong (Donkey Kong) vs ? (Ridley) | 27 Nov '24", 'ChunkyKong', ['donkey-kong'], '?', ['ridley'], '2024-12-30'],
  ['depth-chunkykong-jahzz0-2', "ChunkyKong (Donkey Kong) vs Jahzz0 (Ken) | 29 Nov '24", 'ChunkyKong', ['donkey-kong'], 'Jahzz0', ['ken'], '2024-12-04'],
  ['depth-chunkykong-bassmage', "ChunkyKong (Donkey Kong) vs BassMage (Jigglypuff) | 27 Nov '24", 'ChunkyKong', ['donkey-kong'], 'BassMage', ['jigglypuff'], '2024-12-04'],

  ['depth-bigd-ludwigfrog', 'Battle of BC 8 - LudwigFrog (Greninja) vs Big D (Ice Climbers)', 'LudwigFrog', ['greninja'], 'Big D', ['ice-climbers'], '2026-06-15'],
  ['depth-bigd-brokensink', 'Battle of BC 8 - BrokenSink (Kazuya) vs Big D (Ice Climbers)', 'BrokenSink', ['kazuya'], 'Big D', ['ice-climbers'], '2026-06-15'],
  ['depth-bigd-jdv', 'Pataka 2026 - Big D (Ice Climbers) vs JDV (Pac-Man)', 'Big D', ['ice-climbers'], 'JDV', ['pac-man'], '2026-02-04'],
  ['depth-bigd-latios', 'Pataka 2026 - Big D (Ice Climbers) vs latio$ (Yoshi)', 'Big D', ['ice-climbers'], 'latio$', ['yoshi'], '2026-02-04'],
  ['depth-luis-bigd', 'EugeneBound Summers - Lui$ (Palutena) vs Big D (Ice Climbers)', 'Lui$', ['palutena'], 'Big D', ['ice-climbers'], '2025-10-03'],
  ['depth-sd-bigd', 'EugeneBound Summers - SD (Hero) vs Big D (Ice Climbers)', 'SD', ['hero'], 'Big D', ['ice-climbers'], '2025-10-03'],
  ['depth-jahzzo-bigd', "Goin' Up! Prelocal - Jahzzo (Sonic) vs Big D (Ice Climbers)", 'Jahzzo', ['sonic'], 'Big D', ['ice-climbers'], '2025-09-04'],
  ['depth-bigd-seesaw', 'Boomers Vs. Zoomers - Big D (Ice Climbers) vs Seesaw (Incineroar)', 'Big D', ['ice-climbers'], 'Seesaw', ['incineroar'], '2025-08-25'],
  ['depth-bigd-pacstreet', 'Boomers Vs. Zoomers - Big D (Ice Climbers) vs Pacstreet (Min Min, Pac-Man)', 'Big D', ['ice-climbers'], 'Pacstreet', ['min-min', 'pac-man'], '2025-08-25'],
  ['depth-bigd-lemmon', 'Boomers Vs. Zoomers - Big D (Ice Climbers) vs Lemmon (Joker)', 'Big D', ['ice-climbers'], 'Lemmon', ['joker'], '2025-08-25'],

  ['depth-naetoru-ang', 'Pre S Factor X3 - NaetorU (Pichu) vs Ang (Toon Link)', 'NaetorU', ['pichu'], 'Ang', ['toon-link'], '2026-07-16'],
  ['depth-leaf-naetoru', 'Pre S Factor X3 - Leaf (Peach) vs NaetorU (Pichu)', 'Leaf', ['peach'], 'NaetorU', ['pichu'], '2026-07-16'],
  ['depth-mkbigboss-naetoru', 'Pre S Factor X3 - MKBigBoss (ROB) vs NaetorU (Pichu)', 'MKBigBoss', ['rob'], 'NaetorU', ['pichu'], '2026-07-16'],
  ['depth-grenitsu-naetoru', 'GG2026 - Grenitsu (Ness) vs NaetorU (Pichu)', 'Grenitsu', ['ness'], 'NaetorU', ['pichu'], '2026-07-06'],
  ['depth-naetoru-raarchyor', 'GG2026 - NaetorU (Pichu) vs Raarchyor (Sora)', 'NaetorU', ['pichu'], 'Raarchyor', ['sora'], '2026-07-06'],
  ['depth-raarchyor-naetoru', 'GG2026 - Raarchyor (Sora) vs NaetorU (Pichu)', 'Raarchyor', ['sora'], 'NaetorU', ['pichu'], '2026-07-06'],
  ['depth-naetoru-hamidou', 'GG2026 - NaetorU (Pichu) vs Hamidou (Joker)', 'NaetorU', ['pichu'], 'Hamidou', ['joker'], '2026-07-06'],
  ['depth-naetoru-jtibiz', 'GG2026 - NaetorU (Pichu) vs Jtibiz (Kirby)', 'NaetorU', ['pichu'], 'Jtibiz', ['kirby'], '2026-07-06'],
  ['depth-ismaelis-naetoru', 'GG2026 - Ismaelis (Ridley) vs NaetorU (Pichu)', 'Ismaelis', ['ridley'], 'NaetorU', ['pichu'], '2026-07-06'],
  ['depth-naetoru-gabourella', 'GG2026 - NaetorU (Pichu) vs Gabourella (Falco)', 'NaetorU', ['pichu'], 'Gabourella', ['falco'], '2026-07-06'],

  ['depth-vins-kepler', 'HopLan 2026 - Kepler (Snake) vs VinS (Link)', 'Kepler', ['snake'], 'VinS', ['link'], '2026-07-21'],
  ['depth-vins-monnaiebison30', 'HopLan 2026 - VinS (Link) vs MonnaieBison30 (Ness)', 'VinS', ['link'], 'MonnaieBison30', ['ness'], '2026-07-21'],
  ['depth-etish-vins', 'Three Hord Series Edition 2 - Etish (Palutena) vs VinS (Link)', 'Etish', ['palutena'], 'VinS', ['link'], '2026-07-21'],
  ['depth-vins-ryukai', 'Three Hord Series Edition 2 - VinS (Link) vs Ryukai (Fox)', 'VinS', ['link'], 'Ryukai', ['fox'], '2026-07-21'],
  ['depth-ismaelis-vins', 'DEAD ZONE #3 - Ismaelis (Ridley) vs VinS (Link)', 'Ismaelis', ['ridley'], 'VinS', ['link'], '2026-04-07'],
  ['depth-raarchyor-vins', 'PANAME ALL STARS - Raarchyor (Cloud) vs VinS (Link)', 'Raarchyor', ['cloud'], 'VinS', ['link'], '2026-03-12'],
  ['depth-vins-mkbigboss', 'SMASHMANIA - VinS (Link) vs MKBigBoss (ROB)', 'VinS', ['link'], 'MKBigBoss', ['rob'], '2025-11-15'],
  ['depth-vins-a8z', 'Bussy Esports Vibes 2025 - VinS (Link) vs A8Z (Joker)', 'VinS', ['link'], 'A8Z', ['joker'], '2025-10-16'],
  ['depth-vins-blueriegan', 'Bussy Esports Vibes 2025 - VinS (Link) vs Blueriegan (Sonic)', 'VinS', ['link'], 'Blueriegan', ['sonic'], '2025-10-16'],
  ['depth-susu-vins', 'Bussy Esports Vibes 2025 - Susu (Mii Swordfighter, Steve) vs VinS (Link)', 'Susu', ['mii-swordfighter', 'steve'], 'VinS', ['link'], '2025-10-16'],

  ['depth-tk1-niko4', 'LMBM 2026 - TK1 (Kirby) vs Niko4 (Kazuya)', 'TK1', ['kirby'], 'Niko4', ['kazuya'], '2026-01-25'],
  ['depth-kola-tk1', 'LMBM 2026 - Kola (ROB) vs TK1 (Kirby)', 'Kola', ['rob'], 'TK1', ['kirby'], '2026-01-24'],
  ['depth-tk1-wisteria', 'Supernova 2025 - TK1 (Kirby) vs Wisteria (Joker)', 'TK1', ['kirby'], 'Wisteria', ['joker'], '2025-08-09'],
  ['depth-tk1-djohnmark', 'ESW #285 - TK1 (Kirby) vs Djohnmark (Lucina)', 'TK1', ['kirby'], 'Djohnmark', ['lucina'], '2025-02-28'],
  ['depth-tk1-starforce', 'ESW #285 - TK1 (Kirby) vs Starforce (Pac-Man)', 'TK1', ['kirby'], 'Starforce', ['pac-man'], '2025-02-28'],
  ['depth-tk1-gen', 'ESW #284 - TK1 (Kirby) vs Gen (Palutena)', 'TK1', ['kirby'], 'Gen', ['palutena'], '2025-02-20'],
  ['depth-tk1-noku', 'ESW #282 - TK1 (Kirby) vs Noku (Pokemon Trainer)', 'TK1', ['kirby'], 'Noku', ['squirtle', 'ivysaur', 'charizard'], '2025-02-05'],
  ['depth-sirmoves-tk1', 'ESW #283 - Sir Moves (Yoshi) vs TK1 (Kirby)', 'Sir Moves', ['yoshi'], 'TK1', ['kirby'], '2025-02-05'],
  ['depth-zerotunone-tk1', 'ESW #282 - ZeroTuNone (Zelda) vs TK1 (Kirby)', 'ZeroTuNone', ['zelda'], 'TK1', ['kirby'], '2025-02-05'],
  ['depth-tk1-infernape', 'ESW #281 - TK1 (Kirby) vs Infernape (Diddy Kong)', 'TK1', ['kirby'], 'Infernape', ['diddy-kong'], '2025-01-28'],

  ['depth-lammers44-t3dom', 'UAS: LAS Top 32 - Lammers44 (Mii Gunner) vs T3 Dom (Richter)', 'Lammers44', ['mii-gunner'], 'T3 Dom', ['richter'], '2025-07-15'],
  ['depth-kurama-t3dom', 'UAS: Finale - Kurama (Mario) vs T3 Dom (Richter)', 'Kurama', ['mario'], 'T3 Dom', ['richter'], '2025-07-14'],
  ['depth-t3dom-yusuf', 'UAS: Finale - T3 DOM (Richter) vs yusuf (Meta Knight)', 'T3 DOM', ['richter'], 'yusuf', ['meta-knight'], '2025-07-14'],
  ['depth-t3dom-mkleo', 'UAS: LAS - T3 Dom (Richter) vs MkLeo (Joker)', 'T3 Dom', ['richter'], 'MkLeo', ['joker'], '2025-07-13'],
  ['depth-t3dom-andrik', 'UAS: LAS - T3 Dom (Richter) vs Andrik (Captain Falcon)', 'T3 Dom', ['richter'], 'Andrik', ['captain-falcon'], '2025-07-13'],
  ['depth-t3dom-regalo', 'LMBM 2024 - T3 DOM (Richter) vs Regalo (Lucas)', 'T3 DOM', ['richter'], 'Regalo', ['lucas'], '2024-01-12'],
  ['depth-demon-t3dom', 'Game Lab Smash #112 - Demon (Bayonetta) vs T3 DOM (Richter)', 'Demon', ['bayonetta'], 'T3 DOM', ['richter'], '2023-11-04'],
  ['depth-nito-t3dom', 'Game Lab Smash #112 - Nito (Kazuya) vs T3 DOM (Richter)', 'Nito', ['kazuya'], 'T3 DOM', ['richter'], '2023-11-04'],
  ['depth-zomba-t3dom', 'SSC 2023 - Zomba (ROB) vs T3 DOM (Richter)', 'Zomba', ['rob'], 'T3 DOM', ['richter'], '2023-08-12'],
  ['depth-t3dom-ck', 'SSC 2023 - T3 DOM (Richter) vs C-K (Link)', 'T3 DOM', ['richter'], 'C-K', ['link'], '2023-08-11'],

  ['depth-ven-dollar', 'WaveDash 2023 - Ven (Zelda) vs $$$ (Zelda)', 'Ven', ['zelda'], '$$$', ['zelda'], '2023-06-19'],
  ['depth-ven-lima', 'WaveDash 2023 - ven (Zelda) vs Lima (Bayonetta)', 'ven', ['zelda'], 'Lima', ['bayonetta'], '2023-06-19'],
  ['depth-ven-schu', 'WaveDash 2023 - ven (Zelda) vs Schu (King Dedede)', 'ven', ['zelda'], 'Schu', ['king-dedede'], '2023-06-17'],
  ['depth-ven-shadyverse', 'WaveDash 2023 - ven (Zelda) vs Across The Shadyverse (Pyra/Mythra)', 'ven', ['zelda'], 'Across The Shadyverse', ['pyra', 'mythra'], '2023-06-17'],
  ['depth-ven-steb', 'WaveDash 2023 - Ven (Zelda) vs Steb (Pikachu)', 'Ven', ['zelda'], 'Steb', ['pikachu'], '2023-06-17'],
  ['depth-mvd-ven', 'Knockdown 77 - MVD (Snake) vs Ven (Zelda)', 'MVD', ['snake'], 'Ven', ['zelda'], '2023-06-11'],
  ['depth-ven-iggy', 'Smash It Up 91 - ven (Zelda) vs Dr. Iggy (Terry)', 'ven', ['zelda'], 'Dr. Iggy', ['terry'], '2023-06-10'],
  ['depth-ven-juice', 'Smash It Up 91 - ven (Zelda) vs Juice (Wario)', 'ven', ['zelda'], 'Juice', ['wario'], '2023-06-10'],
  ['depth-ven-capitancito', 'Smash It Up 91 - ven (Zelda) vs Capitancito (Wolf)', 'ven', ['zelda'], 'Capitancito', ['wolf'], '2023-06-10'],
  ['depth-ven-cley', 'Rebel Rivals 5 - ven (Zelda) vs Cley (Fox)', 'ven', ['zelda'], 'Cley', ['fox'], '2023-06-09'],

  ['depth-capitancito-illusion-wolf', 'SIU 88 - Capitancito (Wolf) vs IllusioN (Zero Suit Samus)', 'Capitancito', ['wolf'], 'IllusioN', ['zero-suit-samus'], '2023-05-06'],
  ['depth-capitancito-edgar', 'SIU 88 - Capitancito (Wolf) vs edgar (Meta Knight)', 'Capitancito', ['wolf'], 'edgar', ['meta-knight'], '2023-05-06'],
  ['depth-capitancito-wrath-gf', 'Smash It Up - Capitancito (Mii Gunner) vs Wrath (Sonic)', 'Capitancito', ['mii-gunner'], 'Wrath', ['sonic'], '2023-02-22'],
  ['depth-capitancito-ven', 'Smash It Up - Capitancito (Mii Gunner) vs ven (Zelda)', 'Capitancito', ['mii-gunner'], 'ven', ['zelda'], '2023-02-22'],
  ['depth-capitancito-illusion-gunner', 'Smash It Up - Capitancito (Mii Gunner) vs IllusioN (Zero Suit Samus)', 'Capitancito', ['mii-gunner'], 'IllusioN', ['zero-suit-samus'], '2023-02-22'],
  ['depth-wrath-capitancito', 'Smash It Up - Wrath (Sonic) vs Capitancito (Mii Gunner)', 'Wrath', ['sonic'], 'Capitancito', ['mii-gunner'], '2023-02-22'],
  ['depth-capitancito-grandmaster', 'Smash It Up - Capitancito (Mii Gunner) vs Grandmaster (Robin)', 'Capitancito', ['mii-gunner'], 'Grandmaster', ['robin'], '2023-02-22'],
  ['depth-saltone-capitancito', 'LVL UP EXPO 2023 - SALTONE (Roy, Cloud) vs Capitancito (Mii Gunner)', 'SALTONE', ['roy', 'cloud'], 'Capitancito', ['mii-gunner'], '2023-02-19'],
  ['depth-mvd-capitancito', 'LVL UP EXPO 2023 - MVD (Snake) vs Capitancito (Mii Gunner)', 'MVD', ['snake'], 'Capitancito', ['mii-gunner'], '2023-02-19'],
  ['depth-capitancito-kreeg', 'LVL UP EXPO 2023 - Capitancito (Mii Gunner) vs Kreeg (Marth)', 'Capitancito', ['mii-gunner'], 'Kreeg', ['marth'], '2023-02-19'],

  ['depth-acrux-ma-253', 'Beijing Smash #253 - Acrux (Cloud) vs MA (Link)', 'Acrux', ['cloud'], 'MA', ['link'], '2026-06-29'],
  ['depth-acrux-inkling-253', 'Beijing Smash #253 - Acrux (Cloud, Pyra, Mythra) vs 虫子 (Inkling)', 'Acrux', ['cloud', 'pyra', 'mythra'], '虫子', ['inkling'], '2026-06-29'],
  ['depth-jioyi-acrux', 'Beijing Smash #253 - Jioyi (Bowser Jr.) vs Acrux (Cloud)', 'Jioyi', ['bowser-jr'], 'Acrux', ['cloud'], '2026-06-29'],
  ['depth-ma-acrux-252', 'Beijing Smash #252 - MA (Link) vs Acrux (Cloud, Pyra, Mythra)', 'MA', ['link'], 'Acrux', ['cloud', 'pyra', 'mythra'], '2026-06-08'],
  ['depth-ken-acrux-252-lf', 'Beijing Smash #252 - 沈阳子龙 (Ken) vs Acrux (Cloud, Pyra, Mythra)', '沈阳子龙', ['ken'], 'Acrux', ['cloud', 'pyra', 'mythra'], '2026-06-08'],
  ['depth-ken-acrux-252', 'Beijing Smash #252 - 沈阳子龙 (Ken) vs Acrux (Pyra, Mythra, Cloud)', '沈阳子龙', ['ken'], 'Acrux', ['pyra', 'mythra', 'cloud'], '2026-06-08'],
  ['depth-pino-acrux', 'Beijing Smash #251 - Pino (Lucina) vs Acrux (Cloud)', 'Pino', ['lucina'], 'Acrux', ['cloud'], '2026-06-01'],
  ['depth-ma-acrux-251', 'Beijing Smash #251 - MA (Link) vs Acrux (Game & Watch, Cloud, Pyra, Mythra)', 'MA', ['link'], 'Acrux', ['mr-game-and-watch', 'cloud', 'pyra', 'mythra'], '2026-06-01'],

  ['depth-justblue-springyl', 'Patchwork 2026 - Just Blue (Wii Fit Trainer) vs SpringyL (Sonic)', 'Just Blue', ['wii-fit-trainer'], 'SpringyL', ['sonic'], '2026-07-07'],
  ['depth-justblue-fiji', 'Patchwork 2026 - Just Blue (Wii Fit Trainer) vs Fiji (Luigi, Pac-Man)', 'Just Blue', ['wii-fit-trainer'], 'Fiji', ['luigi', 'pac-man'], '2026-06-25'],
  ['depth-justblue-hero', 'Bay State Beatdown 197 - Just Blue (Wii Fit Trainer, Mii Brawler) vs Ἰλία (Hero)', 'Just Blue', ['wii-fit-trainer', 'mii-brawler'], 'Ἰλία', ['hero'], '2026-05-16'],
  ['depth-justblue-treble', 'Bay State Beatdown 197 - Just Blue (Wii Fit Trainer) vs Treble (Kazuya)', 'Just Blue', ['wii-fit-trainer'], 'Treble', ['kazuya'], '2026-05-16'],
  ['depth-justblue-genius', 'Bay State Beatdown 197 - Just Blue (Mii Brawler, Wii Fit Trainer) vs Humble Genius (Pokemon Trainer)', 'Just Blue', ['mii-brawler', 'wii-fit-trainer'], 'Humble Genius', ['squirtle', 'ivysaur', 'charizard'], '2026-05-16'],
  ['depth-justblue-nuggetz', 'Bay State Beatdown 197 - Just Blue (Mii Brawler, Wii Fit Trainer) vs Nuggetz (Daisy)', 'Just Blue', ['mii-brawler', 'wii-fit-trainer'], 'Nuggetz', ['daisy'], '2026-05-16'],
  ['depth-justblue-seel', 'The Bay State Gala 2026 - Just Blue (Wii Fit Trainer) vs Seel (Ice Climbers)', 'Just Blue', ['wii-fit-trainer'], 'Seel', ['ice-climbers'], '2026-04-17'],
  ['depth-justblue-javi', 'Bay State Beatdown 183 - Just Blue (Wii Fit Trainer) vs JAVI ON EARTH (Villager)', 'Just Blue', ['wii-fit-trainer'], 'JAVI ON EARTH', ['villager'], '2026-01-13'],

  ['depth-mezcaul-yahiko', 'Le Parthénon #5 - Mezcaul (Mii Swordfighter, Ridley) vs Yahiko (Samus)', 'Mezcaul', ['mii-swordfighter', 'ridley'], 'Yahiko', ['samus'], '2025-07-12'],
  ['depth-mezcaul-starplatinum', 'Le Parthénon #5 - Mezcaul (Ridley) vs STAR_PLATINUM (Kazuya)', 'Mezcaul', ['ridley'], 'STAR_PLATINUM', ['kazuya'], '2025-07-12'],
  ['depth-kid-mezcaul', 'Le Parthénon #5 - KID (Mii Brawler) vs Mezcaul (Ridley)', 'KID', ['mii-brawler'], 'Mezcaul', ['ridley'], '2025-07-12'],
  ['depth-shirolebg-mezcaul', 'Le Parthénon #5 - Shirolebg (Ness) vs Mezcaul (Ridley)', 'Shirolebg', ['ness'], 'Mezcaul', ['ridley'], '2025-07-12'],

  ['depth-nightpixl-almost', 'SMASHDOWN THE NEW CHALLENGERS - Almost (Aegis, Ike) vs NightPixL (Kirby)', 'Almost', ['pyra', 'mythra', 'ike'], 'NightPixL', ['kirby'], '2026-06-12'],
  ['depth-nightpixl-ilyua', 'SMASHDOWN THE NEW CHALLENGERS - NightPixL (Kirby) vs Iluya (Marth)', 'NightPixL', ['kirby'], 'Iluya', ['marth'], '2026-06-12'],
  ['depth-nightpixl-moha', 'SMASHDOWN THE NEW CHALLENGERS - NightPixL (Mii Brawler) vs moha (Meta Knight)', 'NightPixL', ['mii-brawler'], 'moha', ['meta-knight'], '2026-06-12'],

  ['depth-smashbros-freekayflock-gf', 'SOS Game Night 100 - Smashbros! (Lucas) vs Free KayFlock (Zelda) - Grand Finals', 'Smashbros!', ['lucas'], 'Free KayFlock', ['zelda'], '2026-07-11'],
  ['depth-smashbros-freekayflock-wf', 'SOS Game Night 100 - Smashbros! (Lucas) vs Free KayFlock (Zelda) - Winners Finals', 'Smashbros!', ['lucas'], 'Free KayFlock', ['zelda'], '2026-07-11'],
] as const

export const proIndexedCoverageDepth = seeds.map((seed) => {
  const [id, title, playerTag, playerFighterIds, opponentTag, opponentFighterIds, date] = seed
  return {
    id,
    title,
    playerTag,
    playerFighterIds,
    opponentTag,
    opponentFighterIds,
    date,
    sourceUrls: [playerIndex(playerTag), pairIndex(playerTag, opponentTag)],
    evidenceStatus: 'source-index' as const,
  }
}) satisfies readonly ProIndexedCoverageSet[]
