import { buildProVodQuality } from '../lib/proLab'
import type { ProVodRecord } from './proLabTypes'
import { smashTubePairIndex } from './proLabVodIndex'

export interface HistoricalIndexedSetSeed {
  id: string
  playerId: string
  playerTag: string
  playerFighterIds: readonly string[]
  opponentTag: string
  sourceDateAnchor: string
  sourceLabel: string
}

export function smashTubePlayerIndex(playerTag: string) {
  return `https://www.smash-tube.com/en/result?player1=${encodeURIComponent(playerTag)}`
}

/**
 * High-throughput historical acquisition record.
 *
 * The public Smash Tube index establishes an organized SSBU match-video entry,
 * player tags, target character label(s), source label, and a public date anchor.
 * It does not establish an exact watch URL, exact tournament day, exact patch,
 * opponent character, upload-channel quality, or tactical meaning. Those fields
 * stay deliberately unresolved until the later link-resolution/review stages.
 */
export function buildHistoricalIndexedSet(seed: HistoricalIndexedSetSeed): ProVodRecord {
  const pairIndexUrl = smashTubePairIndex(seed.playerTag, seed.opponentTag)
  const playerIndexUrl = smashTubePlayerIndex(seed.playerTag)

  return {
    id: seed.id,
    title: `${seed.sourceLabel} — ${seed.playerTag} vs. ${seed.opponentTag}`,
    playerId: seed.playerId,
    playerFighterIds: seed.playerFighterIds,
    opponentTag: seed.opponentTag,
    opponentFighterIds: [],
    event: seed.sourceLabel,
    eventTier: 'unknown',
    date: seed.sourceDateAnchor,
    datePrecision: 'event-anchor',
    round: seed.sourceLabel,
    videoUrl: pairIndexUrl,
    videoProvider: 'other',
    linkKind: 'source-index',
    gameVersion: 'unknown',
    sourceUrls: [pairIndexUrl, playerIndexUrl],
    analysisStatus: 'cataloged',
    quality: buildProVodQuality(
      {
        competitionEnvironment: true,
        fullSet: true,
        officialOrTournamentChannel: false,
        visibleGameplay: false,
        patchKnown: false,
        strongOpposition: false,
        characterConfirmed: true,
        provenance: true,
      },
      [
        'This record comes from a public SSBU tournament-match video index; the exact YouTube watch target still needs resolution.',
        'The stored date is the public source-index date anchor and is not asserted as the exact tournament-set day when the older index entry does not prove that distinction.',
        'Target fighter labels are retained at set/index level only. Opponent character, per-game switching, tactical choices, and player intent remain unclaimed until direct footage review.',
        'Exact patch metadata remains unknown even when the footage is from the long-running final-balance-patch era.',
      ],
    ),
  }
}
