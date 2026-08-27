import type { ProVodRecord } from './proLabTypes'

/**
 * Tight source-anchor recovery pass for historical Smash Tube records.
 *
 * Each mapping requires an explicit player-pair title, the expected target fighter
 * in that title, and exactly one plausible pair upload inside a three-day window
 * around the public source-index date anchor. Distant same-pair uploads and
 * fighter-mismatched candidates are not accepted.
 */
export const proVodYoutubeResolutionsBulk7: Readonly<Record<string, string>> = {
  'final293-a-029': 'tofNwFeD14w',
  'final293-a-037': 'aftjy6p0afA',
  'final293-a-054': 'twiWKTytcyY',
  'final293-a-069': 'TpF6ma_s2uU',
  'final293-b-046': 'BgK2hiFhr2Q',
  'final293-c-039': 'xyfdUjDYogo',
}

export function applyProVodLinkResolutionBulk7(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk7[vod.id]
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
        'The direct YouTube target was recovered from a unique tight-date player-pair candidate whose title confirms the expected fighter; tactical review remains pending.',
      ],
    },
  }
}
