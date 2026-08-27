import type { ProVodRecord } from './proLabTypes'

/**
 * Alias/Unicode-aware recovery pass.
 *
 * These records were missed by the earlier Romanized-title resolver. Each target
 * is backed by an exact player pair plus source-event/date evidence, with the
 * expected player's character visible in the recovered title where applicable.
 *
 * Two superficially strong Raflow/Mezcaul results from the same retry were
 * deliberately rejected because the recovered videos show Game & Watch while
 * those catalog records expect Palutena.
 */
export const proVodYoutubeResolutionsBulk6: Readonly<Record<string, string>> = {
  'hist6-051': 'zGQAUjZI5MI',
  'hist6-191': 'x69Jf-kTx_k',
  'hist6-208': '-XhHPg8Ff1w',
  'hist6-220': 'GcPQPie5ito',
  'hist6-298': 'BMtR4_wzuig',
}

export function applyProVodLinkResolutionBulk6(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk6[vod.id]
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
        'The direct YouTube target was recovered by an alias/Unicode-aware search requiring exact player-pair plus source-event/date corroboration; tactical review remains pending.',
      ],
    },
  }
}
