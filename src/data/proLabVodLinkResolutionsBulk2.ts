import type { ProVodRecord } from './proLabTypes'

/**
 * Resolver v2 bulk direct-watch recovery. Every entry is an automatically
 * accepted high-confidence unique match backed by Smasharchives player,
 * opponent, character and date/event/round evidence. Ambiguous candidates are
 * deliberately excluded and remain source-index records for manual review.
 */
export const proVodYoutubeResolutionsBulk2: Readonly<Record<string, string>> = {

}

export function applyProVodLinkResolutionBulk2(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk2[vod.id]
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
        'The gameplay-bearing YouTube set target was resolved by the high-confidence parallel link-recovery pass; tactical review remains pending.',
      ],
    },
  }
}
