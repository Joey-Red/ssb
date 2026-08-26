import { buildProVodQuality } from '../lib/proLab'
import type { ProVodRecord } from './proLabTypes'

const sourceBackedTournamentQuality = (notes: readonly string[] = []) =>
  buildProVodQuality(
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
    ['Tournament and character use are source-backed. Exact patch metadata remains unclaimed.', ...notes],
  )

export const supplementalProVodCatalog = [
  {
    id: 'lvlup-2026-karaage-loaf',
    title: 'LVL UP EXPO 2026 — Karaage vs. loaf',
    playerId: 'karaage',
    playerFighterIds: ['captain-falcon'],
    opponentTag: 'loaf',
    opponentFighterIds: ['wario'],
    event: 'LVL UP EXPO 2026',
    eventTier: 'supermajor',
    date: '2026-04-25',
    round: 'Bracket round not yet verified',
    videoUrl: 'https://www.youtube.com/watch?v=c1FdYhh1Iy0',
    videoProvider: 'youtube',
    videoId: 'c1FdYhh1Iy0',
    gameVersion: 'unknown',
    sourceUrls: [
      'https://www.youtube.com/watch?v=c1FdYhh1Iy0',
      'https://www.ssbwiki.com/Tournament:LVL_UP_EXPO_2026',
    ],
    analysisStatus: 'review-queued',
    quality: sourceBackedTournamentQuality([
      'Verified VGBootCamp upload explicitly labels Karaage as Captain Falcon and loaf as Wario.',
    ]),
  },
  {
    id: 'lvlup-2026-ouch-neo',
    title: 'LVL UP EXPO 2026 — Neo vs. Ouch!?',
    playerId: 'ouch',
    playerFighterIds: ['wolf'],
    opponentTag: 'Neo',
    opponentFighterIds: ['corrin'],
    event: 'LVL UP EXPO 2026',
    eventTier: 'supermajor',
    date: '2026-04-25',
    round: 'Bracket round not yet verified',
    videoUrl: 'https://www.youtube.com/watch?v=3h_eHpJEUfA',
    videoProvider: 'youtube',
    videoId: '3h_eHpJEUfA',
    gameVersion: 'unknown',
    sourceUrls: [
      'https://www.youtube.com/watch?v=3h_eHpJEUfA',
      'https://www.ssbwiki.com/Tournament:LVL_UP_EXPO_2026',
    ],
    analysisStatus: 'review-queued',
    quality: sourceBackedTournamentQuality([
      'Verified VGBootCamp upload explicitly labels Neo as Corrin and Ouch!? as Wolf.',
    ]),
  },
  {
    id: 'comicpalooza-2026-tea-atomic',
    title: 'Comicpalooza Fight Club 2026 — Tea vs. Atomic',
    playerId: 'tea',
    playerFighterIds: ['pac-man'],
    opponentTag: 'Atomic',
    opponentFighterIds: ['rob'],
    event: 'Comicpalooza Fight Club 2026',
    eventTier: 'regional',
    date: '2026-05-24',
    round: 'Losers Quarterfinals / Top 8',
    videoUrl: 'https://www.youtube.com/watch?v=O5FJRJDsXVk',
    videoProvider: 'youtube',
    videoId: 'O5FJRJDsXVk',
    gameVersion: 'unknown',
    sourceUrls: [
      'https://www.youtube.com/watch?v=O5FJRJDsXVk',
      'https://www.ssbwiki.com/Tournament:Comicpalooza_Fight_Club_2026',
    ],
    analysisStatus: 'review-queued',
    quality: sourceBackedTournamentQuality([
      'Collision Gaming Series upload explicitly labels Tea as Pac-Man and Atomic as R.O.B. in Losers Quarterfinals.',
      'The event is conservatively classified as regional in this app despite external sources describing it as a superregional/national.',
    ]),
  },
] as const satisfies readonly ProVodRecord[]
