import type { ProVodRecord } from './proLabTypes'

/**
 * Zero-candidate recovery batch.
 *
 * These records were invisible to the earlier title search until explicit tag
 * aliases/Japanese names and broader pair-only queries were added. Promotion is
 * still conservative: the recovered title must name both players, confirm the
 * expected target fighter, and uniquely align to the source anchor/event window.
 */
export const proVodYoutubeResolutionsBulk8: Readonly<Record<string, string>> = {
  'hist6-041': 'RuBeXmdI3rg',
  'hist6-045': '5G37oxo343g',
  'hist6-077': '_LWzhoA5aW0',
  'final293-b-120': 'egHufco3L7c',
  'final293-b-122': 'nP6B9Ul2pMI',
  'final293-b-123': '8tge8AHIw1U',
  'final293-b-128': '0U1D8TK212c',
  'final293-c-007': 'JbU15hYv2Wg',
  'final293-c-009': 'kgCO3e2DKaw',
  'final293-c-105': 'NRaUq5sWhx8',
}

export function applyProVodLinkResolutionBulk8(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk8[vod.id]
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
        'The direct YouTube target was recovered by an explicit alias/Japanese-name pair search and then admitted only after source-anchor/event and expected-fighter corroboration; tactical review remains pending.',
      ],
    },
  }
}
