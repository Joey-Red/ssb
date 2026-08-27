import type { ProVodRecord } from './proLabTypes'

/**
 * Full-candidate and named-event remainder recovery pass.
 *
 * Generic source-index records only qualify when the complete candidate set
 * collapses to one pair + expected-fighter target inside the tight source-date
 * window. Named-event records additionally require the documented event/round
 * and fighter identities to match. Truncated-search false uniques are excluded.
 */
export const proVodYoutubeResolutionsBulk10: Readonly<Record<string, string>> = {
  'final293-a-033': 'apd9GJYdtKk',
  'final293-b-043': 'EtE2pAY_oc4',
  'final293-b-044': 'r91j0Uj4vho',
  'final293-b-084': '1_t2Y5Gi0F0',
  'patchwork26-11': 'J3Ue9L5wkNw',
  'patchwork26-21': 'B7dTXAJ1x70',
  'patchwork26-22': 'Mp000lyFnYA',
  'patchwork26-23': 'RmEGzF1dD-E',
  'bobc8-14': 'IMdhxSnbEvI',
  'hist6-143': 'KQh0KeBGXoc',
}

export function applyProVodLinkResolutionBulk10(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk10[vod.id]
  if (!youtubeId) return vod
  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`
  return {
    ...vod,
    videoUrl,
    videoProvider: 'youtube',
    videoId: youtubeId,
    linkKind: 'direct-video',
    analysisStatus: 'review-queued',
    sourceUrls: [videoUrl, ...vod.sourceUrls.filter((url) => url !== videoUrl)],
    quality: {
      ...vod.quality,
      visibleGameplay: true,
      notes: [
        ...vod.quality.notes,
        'The direct YouTube target was recovered from the full pair-candidate set or exact named-event/round evidence with the expected fighter identity; ambiguous rematches and fighter mismatches remain unresolved, and tactical review is still pending.',
      ],
    },
  }
}
