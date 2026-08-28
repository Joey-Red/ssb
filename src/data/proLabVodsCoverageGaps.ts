import { buildProVodQuality } from '../lib/proLab'
import type { ProVodRecord } from './proLabTypes'

const coverageGapVodQuality = (notes: readonly string[] = []) =>
  buildProVodQuality(
    {
      competitionEnvironment: true,
      fullSet: true,
      officialOrTournamentChannel: false,
      visibleGameplay: true,
      patchKnown: false,
      strongOpposition: true,
      characterConfirmed: true,
      provenance: true,
    },
    [
      'Direct match VOD and character usage are corroborated by public competitive archives. Upload-channel ownership and exact patch are left unclaimed.',
      ...notes,
    ],
  )

/**
 * VODs added only when the roster-neutral coverage audit finds a genuine gap.
 * These records do not receive any review-score boost beyond the ordinary Pro
 * Lab coverage/evidence ranking.
 */
export const proCoverageGapVodCatalog = [
  {
    id: 'umebura-sp4-t-link-zackray',
    title: 'Umebura SP4 — T vs. Zackray',
    playerId: 't-link',
    playerFighterIds: ['link'],
    opponentTag: 'Zackray',
    opponentFighterIds: ['joker'],
    event: 'Umebura SP4',
    eventTier: 'major',
    date: '2019-08-17',
    round: 'Bracket round not yet verified',
    videoUrl: 'https://www.youtube.com/watch?v=KSfwiboZjaw',
    videoProvider: 'youtube',
    videoId: 'KSfwiboZjaw',
    linkKind: 'direct-video',
    gameVersion: 'unknown',
    result: 'T 2-0 Zackray',
    sourceUrls: [
      'https://smasharchives.com/vod/KSfwiboZjaw',
      'https://liquipedia.net/smash/Zackray/Results',
      'https://liquipedia.net/smash/Umebura/SP4',
      'https://www.ssbwiki.com/Smasher:T',
    ],
    analysisStatus: 'review-queued',
    quality: coverageGapVodQuality([
      'Smasharchives identifies the archived set as Zackray (Joker) vs T (Link); Liquipedia independently records T defeating Zackray 2-0 at Umebura SP4.',
      'This is legacy-era Link evidence and must not be treated as current-meta proof without current footage.',
    ]),
  },
] as const satisfies readonly ProVodRecord[]
