import type { ProVodRecord } from './proLabTypes'

/**
 * Bulk direct-watch link recovery. Entries are added only after the exact
 * gameplay-bearing YouTube target has been independently resolved from the
 * corresponding source-index record. Tactical review remains a separate stage.
 */
export const proVodYoutubeResolutionsBulk1: Readonly<Record<string, string>> = {
  'final293-c-083': '9we2A0NibYw',
  'final293-c-084': 'Kh9mF3J27JM',
  'final293-c-085': '9mGFamWBlBY',
  'final293-c-086': '1hFC94UTP6k',
  'hist6-252': '6czQlv0ljY8',
  'hist6-253': '9L2FcAe0LIk',
  'hist6-255': '3GACmDu65Bw',
  'hist6-256': 'U2P7_QGdHFU',
  'hist6-245': '8H0t8iqGqTQ',
  'hist6-246': 'ba_6jUUgM_c',
  'hist6-247': 'gJupuJsR86s',
  'hist6-257': 'mv3W8e9aoXU',
  'hist6-263': 'uP8PVgXZIJg',
  'hist6-264': 'yY_tvERT4Kc',
  'hist6-265': 'L3H1b5jWh5s',
  'hist6-267': 'T7mo7r429dg',
  'hist6-268': '2Rw5WAw-3Vg',
  'final293-b-054': 'vcl21kqdx1Y',
  'final293-b-055': 'uox-dTPpAXU',
  'final293-b-057': '8_us4SUWmEU',
  'final293-b-058': 'gDcZYoJwajk',
  'final293-b-059': 'az9EUO1SntQ',
  'final293-b-060': 'EGsGnX4qPxs',
  'final293-b-061': 'U22q2Ts-ALs',
  'final293-b-027': 'hN8J55TueJg',
  'final293-b-028': '9L2FcAe0LIk',
  'final293-b-029': '0HeBAW3YfuQ',
  'final293-b-030': 'JMuTULi9HkQ',
  'hist6-259': 'fAC1INOX_R4',
  'hist6-260': 'GF7Cou0MwXg',
  'final293-b-073': 'YfRWhHQS3jQ',
  'hist6-294': 'wwBTY32UVn8',
  'hist6-295': 'mAEMSkmlqho',
  'final293-a-116': 'yYHpUnc8nMk',
  'final293-c-070': 'zTM_F4IKdqY',
  'hist6-290': '-P_OLXF4YxM',
  'hist6-291': 'acBSpoL2Su8',
  'hist6-292': 'ljhO0LmvhK0',
  'hist6-293': 'qURbo4o5l7U',
  'final293-b-118': 'URAyGBigp48',
  'final293-b-119': 'mCKCB-Wcf-k',
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
