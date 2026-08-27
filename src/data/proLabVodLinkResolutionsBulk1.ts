import type { ProVodRecord } from './proLabTypes'

/**
 * Bulk direct-watch link recovery. Entries are added only after the exact
 * gameplay-bearing YouTube target has been independently resolved from the
 * corresponding source-index record. Tactical review remains a separate stage.
 */
export const proVodYoutubeResolutionsBulk1: Readonly<Record<string, string>> = {
}

export function applyProVodLinkResolutionBulk1(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk1[vod.id]
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
        'The exact gameplay-bearing YouTube set target was resolved during the bulk link-recovery pass; tactical review remains pending.',
      ],
    },
  }
}
