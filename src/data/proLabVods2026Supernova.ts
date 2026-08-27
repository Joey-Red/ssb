import { buildIndexedTournamentVod } from './proLabVodIndex'

const source = 'https://www.ssbwiki.com/Tournament:Supernova_2026'
const event = 'Supernova 2026'
const eventDate = '2026-08-09'
const common = { event, eventTier: 'supermajor' as const, eventDate, tournamentSourceUrl: source, strongOpposition: true }
const unknownRound = 'Bracket round not yet verified'

export const proVodCatalog2026Supernova = [
  buildIndexedTournamentVod({ ...common, id: 'supernova26-01', title: 'Supernova 2026 — Tweek vs. Lima', playerId: 'tweek', playerFighterIds: ['diddy-kong'], opponentTag: 'Lima', opponentFighterIds: ['bayonetta'], round: unknownRound, searchPlayerTag: 'Tweek', searchOpponentTag: 'Lima' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-02', title: 'Supernova 2026 — Sparg0 vs. Tweek', playerId: 'tweek', playerFighterIds: ['diddy-kong'], opponentTag: 'Sparg0', opponentFighterIds: ['cloud'], round: 'Grand Finals', searchPlayerTag: 'Tweek', searchOpponentTag: 'Sparg0' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-03', title: 'Supernova 2026 — mudd vs. Tweek', playerId: 'tweek', playerFighterIds: ['diddy-kong'], opponentTag: 'mudd', opponentFighterIds: ['mr-game-and-watch'], round: 'Winners Finals', searchPlayerTag: 'Tweek', searchOpponentTag: 'mudd' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-04', title: 'Supernova 2026 — Jahzz0 vs. Tweek', playerId: 'tweek', playerFighterIds: ['diddy-kong'], opponentTag: 'Jahzz0', opponentFighterIds: ['ryu'], round: unknownRound, searchPlayerTag: 'Tweek', searchOpponentTag: 'Jahzz0' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-05', title: 'Supernova 2026 — Sonix vs. Tweek', playerId: 'tweek', playerFighterIds: ['diddy-kong'], opponentTag: 'Sonix', opponentFighterIds: ['sonic'], round: unknownRound, searchPlayerTag: 'Tweek', searchOpponentTag: 'Sonix' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-06', title: 'Supernova 2026 — mudd vs. Peabnut', playerId: 'peabnut', playerFighterIds: ['mega-man'], opponentTag: 'mudd', opponentFighterIds: ['mr-game-and-watch'], round: unknownRound, searchPlayerTag: 'Peabnut', searchOpponentTag: 'mudd' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-07', title: 'Supernova 2026 — thirty4 vs. Peabnut', playerId: 'peabnut', playerFighterIds: ['mega-man'], opponentTag: 'thirty4', opponentFighterIds: ['olimar'], round: unknownRound, searchPlayerTag: 'Peabnut', searchOpponentTag: 'thirty4' }),
  buildIndexedTournamentVod({ ...common, id: 'supernova26-08', title: 'Supernova 2026 — Peabnut vs. Fhantum', playerId: 'peabnut', playerFighterIds: ['mega-man'], opponentTag: 'Fhantum', opponentFighterIds: ['steve'], round: unknownRound, searchPlayerTag: 'Peabnut', searchOpponentTag: 'Fhantum' }),
] as const
