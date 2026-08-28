import { buildProVodQuality } from '../lib/proLab'
import type { ProVodRecord } from './proLabTypes'

const completionVodQuality = buildProVodQuality(
  {
    competitionEnvironment: true,
    fullSet: true,
    officialOrTournamentChannel: true,
    visibleGameplay: true,
    patchKnown: false,
    strongOpposition: true,
    characterConfirmed: true,
    provenance: true,
  },
  [
    'East Geek Smash directly published the full Winners Quarterfinals set and explicitly labels TRIGGER as Simon and wabu as Wii Fit Trainer.',
    'TAIYORO independently identifies Weekly Smash Party #122 as a January 31, 2024 offline community event streamed by East Geek Smash.',
    'TRIGGER player sources independently identify Simon as his Ultimate main. Exact patch and tactical conclusions remain unclaimed.',
  ],
)

/**
 * Final direct VOD needed to move the neutral zero-VOD backlog from one fighter
 * to zero. This closes catalog coverage only; gameplay review remains pending.
 */
export const proVodCoverageCompletion = [
  {
    id: 'sumapa122-trigger-wabu-wqf',
    title: 'Weekly Smash Party #122 — TRIGGER vs. wabu',
    playerId: 'trigger-simon',
    playerFighterIds: ['simon'],
    opponentTag: 'wabu',
    opponentFighterIds: ['wii-fit-trainer'],
    event: 'Weekly Smash Party #122',
    eventTier: 'weekly',
    date: '2024-01-31',
    round: 'Winners Quarterfinals',
    videoUrl: 'https://www.youtube.com/watch?v=hehKKzj6RvQ',
    videoProvider: 'youtube',
    videoId: 'hehKKzj6RvQ',
    linkKind: 'direct-video',
    gameVersion: 'unknown',
    sourceUrls: [
      'https://www.youtube.com/watch?v=hehKKzj6RvQ',
      'https://taiyoro.gg/en/e/Iwr4Rr2OTu',
      'https://www.ssbwiki.com/Smasher:TRIGGER',
      'https://liquipedia.net/smash/TRIGGER',
    ],
    analysisStatus: 'review-queued',
    quality: completionVodQuality,
  },
] as const satisfies readonly ProVodRecord[]
