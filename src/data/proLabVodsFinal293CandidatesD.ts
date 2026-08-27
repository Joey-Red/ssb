import { buildHistoricalIndexedSet } from './proLabHistoricalVodIndex'

/**
 * Fresh late-August 2026 index rows used only to close the final five-set
 * shortfall after conservative player/opponent/date de-duplication.
 */
const rows = [
  ['ouch', 'Ouch!?', ['wolf'], 'Purin', '2026-08-23'],
  ['ouch', 'Ouch!?', ['wolf'], 'GamingInAction', '2026-08-23'],
  ['ouch', 'Ouch!?', ['wolf'], 'Sam', '2026-08-23'],
  ['yoshidora', 'Yoshidora', ['yoshi'], 'Johnny', '2026-08-22'],
  ['yoshidora', 'Yoshidora', ['yoshi'], 'Kanon Tenchi Ai', '2026-08-22'],
  ['yoshidora', 'Yoshidora', ['yoshi'], 'Sarada bar p', '2026-08-22'],
] as const

export const proVodFinal293CandidatesD = rows.map(([playerId, playerTag, playerFighterIds, opponentTag, sourceDateAnchor], index) =>
  buildHistoricalIndexedSet({
    id: `final293-d-${String(index + 1).padStart(3, '0')}`,
    playerId,
    playerTag,
    playerFighterIds,
    opponentTag,
    sourceDateAnchor,
    sourceLabel: 'Smash Tube indexed competitive set',
  }),
)
