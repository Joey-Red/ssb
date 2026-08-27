import type { ProVodRecord } from './proLabTypes'

/**
 * Final conservative recovery pass over the post-Bulk4 remainder.
 *
 * These mappings were held back from the automated ambiguity pass because more
 * than one upload represented the same player/opponent pairing. They are only
 * promoted here when event/round/character evidence identifies the underlying
 * set and the selected upload is the clearest matching target (exact round,
 * source label, or closest corroborated publish date).
 *
 * Tactical interpretation remains review-pending.
 */
export const proVodYoutubeResolutionsBulk5: Readonly<Record<string, string>> = {
  'sfactorx3-01': 'JlPTPSkGtEY',
  'sfactorx3-06': 'RPX9GkCUsuU',
  'sfactorx3-23': 'zzp_UQyTs3A',
  'sfactorx3-24': 'ZhV9sGsab7M',
  'hist6-010': '2KgvP5ZxQj4',
  'hist6-060': 'Z7fEWCpvmIo',
  'hist6-086': 'bpf3qj8e8oQ',
  'hist6-102': 'FriNCl9l_6Q',
  'hist6-112': 'Xv44oA4QBiM',
  'hist6-219': 'R1mz1Kk7V1A',
  'hist6-225': 'fgh0G1Mo0OA',
  'patchwork26-33': 'tBLH0lrhPyk',
  'patchwork26-34': '30_b9A6KXCc',
}

export function applyProVodLinkResolutionBulk5(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk5[vod.id]
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
        'The direct YouTube target was recovered from exact player/opponent plus corroborated event, round, character, or source-label evidence; tactical review remains pending.',
      ],
    },
  }
}
