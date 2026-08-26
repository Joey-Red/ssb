import { proVodCatalog } from './proLabVods'

export type ProVodReviewPriority = 'critical' | 'high' | 'normal'
export type ProVodReviewStatus = 'vod-cataloged' | 'metadata-ready' | 'reviewed'

export interface ProVodReviewTarget {
  readonly id: string
  readonly vodId?: string
  readonly event: string
  readonly date: string
  readonly round: string
  readonly playerTags: readonly string[]
  readonly fighterIds: readonly string[]
  readonly videoUrl: string
  readonly setStartSeconds?: number
  readonly priority: ProVodReviewPriority
  readonly status: ProVodReviewStatus
  readonly sourceUrls: readonly string[]
  readonly note: string
}

const priorityForCatalogedVod = (date: string, eventTier: string): ProVodReviewPriority => {
  if (date.startsWith('2026-') && eventTier === 'supermajor') return 'critical'
  if (date.startsWith('2026-') || eventTier === 'supermajor' || eventTier === 'major') return 'high'
  return 'normal'
}

/**
 * Every cataloged VOD automatically becomes a review target. This keeps content
 * acquisition and tactical review separate: metadata can be source-backed now,
 * while decision moments stay unavailable until a human has watched the set.
 */
export const catalogedProVodReviewTargets: readonly ProVodReviewTarget[] = proVodCatalog.map((vod) => ({
  id: `review-${vod.id}`,
  vodId: vod.id,
  event: vod.event,
  date: vod.date,
  round: vod.round,
  playerTags: [vod.playerId, vod.opponentTag],
  fighterIds: [...vod.playerFighterIds, ...vod.opponentFighterIds],
  videoUrl: vod.videoUrl,
  priority: priorityForCatalogedVod(vod.date, vod.eventTier),
  status: 'vod-cataloged',
  sourceUrls: vod.sourceUrls,
  note: 'Catalog metadata is ready. Tactical claims, timestamps inside games, and player intent must be added only after direct footage review.',
}))

/**
 * Source-backed set-start coordinates from the KAGARIBI #15 final-day stream.
 * These are navigation coordinates only. They are NOT tactical annotations and
 * must never be converted into decision claims without watching the footage.
 */
export const kagaribi15StreamReviewTargets = [
  {
    id: 'kagaribi15-stream-doramigi-shuton-wqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Quarterfinals',
    playerTags: ['Doramigi', 'Shuton'],
    fighterIds: ['min-min', 'olimar'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 18 * 60 + 9,
    priority: 'high',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-acola-tweek-wqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Quarterfinals',
    playerTags: ['acola', 'Tweek'],
    fighterIds: ['steve', 'diddy-kong'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 38 * 60 + 11,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-hurt-zomba-wqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Quarterfinals',
    playerTags: ['Hurt', 'Zomba'],
    fighterIds: ['snake', 'rob'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 57 * 60 + 48,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-sparg0-mkleo-wqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Quarterfinals',
    playerTags: ['Sparg0', 'MkLeo'],
    fighterIds: ['pyra', 'mythra'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 1 * 3600 + 25 * 60 + 1,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Aegis mirror set-start coordinate from the published final-day stream. Tactical review is still required.',
  },
  {
    id: 'kagaribi15-stream-hurt-carmelo-ltop12',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Top 12',
    playerTags: ['Hurt', 'Carmelo'],
    fighterIds: ['snake', 'steve'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 1 * 3600 + 46 * 60 + 57,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-doramigi-sparg0-wsf',
    vodId: 'kagaribi15-doramigi-sparg0-wsf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Semifinals',
    playerTags: ['Doramigi', 'Sparg0'],
    fighterIds: ['min-min', 'cloud'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 2 * 3600 + 43 * 60 + 45,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Full-stream coordinate cross-references a separately cataloged set VOD.',
  },
  {
    id: 'kagaribi15-stream-acola-zomba-wsf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Semifinals',
    playerTags: ['acola', 'Zomba'],
    fighterIds: ['steve', 'rob'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 3 * 3600 + 3 * 60 + 46,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-yaura-hurt-ltop8',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Top 8',
    playerTags: ['Yaura', 'Hurt'],
    fighterIds: ['dark-samus', 'snake'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 3 * 3600 + 37 * 60 + 26,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-shuton-mkleo-ltop8',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Top 8',
    playerTags: ['Shuton', 'MkLeo'],
    fighterIds: ['olimar', 'joker'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 3 * 3600 + 57 * 60 + 52,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-doramigi-hurt-lqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Quarterfinals',
    playerTags: ['Doramigi', 'Hurt'],
    fighterIds: ['min-min', 'snake'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 4 * 3600 + 19 * 60 + 29,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-zomba-mkleo-lqf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Quarterfinals',
    playerTags: ['Zomba', 'MkLeo'],
    fighterIds: ['rob', 'joker'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 4 * 3600 + 33 * 60,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-sparg0-acola-wf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Winners Finals',
    playerTags: ['Sparg0', 'acola'],
    fighterIds: ['cloud', 'steve'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 5 * 3600 + 4 * 60 + 12,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Published final-day stream coordinate. Review the footage before recording any tactical observation.',
  },
  {
    id: 'kagaribi15-stream-mkleo-doramigi-lsf',
    vodId: 'kagaribi15-mkleo-doramigi',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Semifinals',
    playerTags: ['MkLeo', 'Doramigi'],
    fighterIds: ['meta-knight', 'joker', 'min-min'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 5 * 3600 + 18 * 60 + 53,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Full-stream coordinate cross-references a separately cataloged set VOD.',
  },
  {
    id: 'kagaribi15-stream-sparg0-doramigi-lf',
    vodId: 'kagaribi15-doramigi-sparg0-lf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Losers Finals',
    playerTags: ['Sparg0', 'Doramigi'],
    fighterIds: ['cloud', 'min-min'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 5 * 3600 + 37 * 60 + 35,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
    ],
    note: 'Full-stream coordinate cross-references a separately cataloged set VOD.',
  },
  {
    id: 'kagaribi15-stream-acola-doramigi-gf',
    event: 'Kagaribi 15',
    date: '2026-05-05',
    round: 'Grand Finals',
    playerTags: ['acola', 'Doramigi'],
    fighterIds: ['steve', 'min-min'],
    videoUrl: 'https://www.youtube.com/watch?v=mVflVyrWS5Y',
    setStartSeconds: 5 * 3600 + 58 * 60 + 18,
    priority: 'critical',
    status: 'metadata-ready',
    sourceUrls: [
      'https://www.youtube.com/watch?v=mVflVyrWS5Y',
      'https://gamezine.jp/17062/',
      'https://area310-gg.com/news/news20260508.html',
    ],
    note: 'Published Grand Finals start coordinate. Result sources exist, but tactical claims still require direct footage review.',
  },
] as const satisfies readonly ProVodReviewTarget[]

export const proVodReviewQueue: readonly ProVodReviewTarget[] = [
  ...catalogedProVodReviewTargets,
  ...kagaribi15StreamReviewTargets,
]

export const proVodReviewQueueStats = {
  totalTargets: proVodReviewQueue.length,
  critical: proVodReviewQueue.filter((target) => target.priority === 'critical').length,
  high: proVodReviewQueue.filter((target) => target.priority === 'high').length,
  normal: proVodReviewQueue.filter((target) => target.priority === 'normal').length,
  reviewed: proVodReviewQueue.filter((target) => target.status === 'reviewed').length,
  pending: proVodReviewQueue.filter((target) => target.status !== 'reviewed').length,
} as const
