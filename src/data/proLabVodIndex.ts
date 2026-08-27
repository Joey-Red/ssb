import { buildProVodQuality } from '../lib/proLab'
import type { ProVodEventTier, ProVodRecord } from './proLabTypes'

export interface IndexedTournamentVodSeed {
  id: string
  title: string
  playerId: string
  playerFighterIds: readonly string[]
  opponentTag: string
  opponentFighterIds: readonly string[]
  event: string
  eventTier: ProVodEventTier
  eventDate: string
  round: string
  searchPlayerTag: string
  searchOpponentTag: string
  tournamentSourceUrl: string
  strongOpposition?: boolean
  result?: string
}

export interface ResolvedTournamentVodSeed extends IndexedTournamentVodSeed {
  youtubeId: string
}

export function smashTubePairIndex(playerTag: string, opponentTag: string) {
  return `https://www.smash-tube.com/en/result?player1=${encodeURIComponent(playerTag)}&player2=${encodeURIComponent(opponentTag)}`
}

/**
 * Builds a catalog-quality discovery record when a tournament-set upload is
 * independently indexed but the direct watch URL has not been resolved yet.
 *
 * These records deliberately do NOT claim that gameplay was directly reviewed
 * or that the upload channel was verified. They are useful for full-roster
 * acquisition and later link resolution while preserving the Pro Lab evidence
 * boundary. The UI labels them as source indexes rather than direct VOD links.
 */
export function buildIndexedTournamentVod(seed: IndexedTournamentVodSeed): ProVodRecord {
  const indexUrl = smashTubePairIndex(seed.searchPlayerTag, seed.searchOpponentTag)
  return {
    id: seed.id,
    title: seed.title,
    playerId: seed.playerId,
    playerFighterIds: seed.playerFighterIds,
    opponentTag: seed.opponentTag,
    opponentFighterIds: seed.opponentFighterIds,
    event: seed.event,
    eventTier: seed.eventTier,
    date: seed.eventDate,
    datePrecision: 'event-anchor',
    round: seed.round,
    videoUrl: indexUrl,
    videoProvider: 'other',
    linkKind: 'source-index',
    gameVersion: 'unknown',
    ...(seed.result ? { result: seed.result } : {}),
    sourceUrls: [indexUrl, seed.tournamentSourceUrl],
    analysisStatus: 'cataloged',
    quality: buildProVodQuality(
      {
        competitionEnvironment: true,
        fullSet: true,
        officialOrTournamentChannel: false,
        visibleGameplay: false,
        patchKnown: false,
        strongOpposition: seed.strongOpposition ?? false,
        characterConfirmed: true,
        provenance: true,
      },
      [
        'The tournament-set upload is source-indexed with both player tags and characters, but the direct watch URL has not yet been resolved.',
        'Gameplay readability, exact game version, and upload-channel quality remain unclaimed until direct footage review.',
        'The stored date is an event-date anchor unless an exact set day is later established during direct-link resolution.',
      ],
    ),
  }
}

/**
 * Builds a record after the exact YouTube watch target has been resolved from
 * the indexed set. Resolution is intentionally not treated as gameplay review:
 * the record enters the footage-review queue while readability, tactics, patch,
 * and player intent remain unclaimed.
 */
export function buildResolvedTournamentVod(seed: ResolvedTournamentVodSeed): ProVodRecord {
  const indexUrl = smashTubePairIndex(seed.searchPlayerTag, seed.searchOpponentTag)
  const videoUrl = `https://www.youtube.com/watch?v=${seed.youtubeId}`
  return {
    id: seed.id,
    title: seed.title,
    playerId: seed.playerId,
    playerFighterIds: seed.playerFighterIds,
    opponentTag: seed.opponentTag,
    opponentFighterIds: seed.opponentFighterIds,
    event: seed.event,
    eventTier: seed.eventTier,
    date: seed.eventDate,
    datePrecision: 'event-anchor',
    round: seed.round,
    videoUrl,
    videoProvider: 'youtube',
    videoId: seed.youtubeId,
    linkKind: 'direct-video',
    gameVersion: 'unknown',
    ...(seed.result ? { result: seed.result } : {}),
    sourceUrls: [videoUrl, indexUrl, seed.tournamentSourceUrl],
    analysisStatus: 'review-queued',
    quality: buildProVodQuality(
      {
        competitionEnvironment: true,
        fullSet: true,
        officialOrTournamentChannel: false,
        visibleGameplay: false,
        patchKnown: false,
        strongOpposition: seed.strongOpposition ?? false,
        characterConfirmed: true,
        provenance: true,
      },
      [
        'The exact YouTube watch target has been resolved from the source index.',
        'Direct-link resolution is not gameplay review; readability, tactics, exact patch, and player intent remain unclaimed.',
        'The stored date remains an event-date anchor unless an exact set day is independently established.',
      ],
    ),
  }
}
