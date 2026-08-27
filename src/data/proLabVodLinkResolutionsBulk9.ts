import type { ProVodRecord } from './proLabTypes'

/**
 * Exact-event and duplicate-upload recovery pass.
 *
 * These mappings are held to one of two evidence patterns:
 * 1. the source label/event, pair and target fighter uniquely identify the set; or
 * 2. multiple candidate URLs are independently indexed copies of the same
 *    documented tournament pairing, with no distinct source identity to preserve.
 *
 * Distinct rematches at the same event remain unresolved.
 */
export const proVodYoutubeResolutionsBulk9: Readonly<Record<string, string>> = {
  'hist6-300': '1x4JEEkVJOs',
  'final293-a-046': 'HsnJawur_Gw',
  'final293-c-031': 'yMAas5XStq4',
  'final293-c-073': 'fyu2AzKqVZA',
  'final293-c-074': 'uVBj-Ts16Xw',
  'final293-c-096': 'EAQJikf5Jko',
  'final293-c-102': 'SfA1TtIteWs',
}

export function applyProVodLinkResolutionBulk9(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk9[vod.id]
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
        'The direct YouTube target was recovered through exact event/pair/fighter evidence or duplicate-upload disambiguation; distinct same-event rematches are deliberately excluded and tactical review remains pending.',
      ],
    },
  }
}
