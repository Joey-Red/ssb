import type { ProVodRecord } from './proLabTypes'

/**
 * Direct YouTube targets recovered from the indexed Patchwork listings. This
 * upgrades navigation to the gameplay-bearing set upload; tactical review is
 * still a separate stage.
 */
export const proVodYoutubeResolutions2026Batch5: Readonly<Record<string, string>> = {
  'patchwork26-01': 'iJO-K7zmItU',
  'patchwork26-09': 'VjGEFUmFWdM',
  'patchwork26-14': 'Bax6zGqqvko',
  'patchwork26-28': 'iT5A_ewuIn4',
  'patchwork26-38': 'dFTxo2QrvC4',
}

export function applyProVodLinkResolution2026Batch5(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutions2026Batch5[vod.id]
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
        'The exact gameplay-bearing YouTube set target was resolved after initial source-index acquisition; tactical review remains pending.',
      ],
    },
  }
}
