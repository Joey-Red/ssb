import type { ProVodRecord } from './proLabTypes'

/**
 * Final Pro Lab source-index recovery pass.
 *
 * Every remaining source-index record is pinned to a direct YouTube target.
 * Named source records use the documented event/pair identity and round when
 * present. The final293 acquisition corpus intentionally collapses same-day
 * pair identities, so those rows use one canonical verified set without
 * inventing a bracket round the stored source identity does not preserve.
 */
export const proVodYoutubeResolutionsBulk11: Readonly<Record<string, string>> = {
  'delta-seibu-05': 'jYvZZIhBnUM',
  'hist6-037': 'FommZZ9Q6e0',
  'hist6-038': 'zkgnl-cOSSE',
  'hist6-042': '4HmE7SPm8xU',
  'hist6-043': 'C1n09yA76O8',
  'hist6-044': 'p_dWSC0VBRk',
  'hist6-103': 'naRMxJ36Xug',
  'hist6-121': 'XHoxSsYoPpc',
  'hist6-125': 'gu7BycnNK8w',
  'hist6-126': 'w5CX0QXSjpI',
  'hist6-148': 'ZlR4aOlXX2w',
  'hist6-149': 'Ig643obCkE4',
  'hist6-203': 'ZFtJJbhLy80',
  'hist6-261': '9khhjx6XbNk',
  'hist6-299': 'cJpOVFk7Zno',
  'final293-a-002': 'h9UnDUpYRIg',
  'final293-a-010': '5nqfoPejPuE',
  'final293-a-012': '66oQv3clu9g',
  'final293-a-013': '2dHt2_KNO-k',
  'final293-a-014': '5fo8MWeB4V0',
  'final293-a-015': '2M6rlfA6Fc4',
  'final293-a-016': 'hGZD6xoBgyA',
  'final293-a-022': 'LAIllqAuRp4',
  'final293-a-025': 'kxIm6kla9hw',
  'final293-a-034': 'QkJkb8LGqqA',
  'final293-a-035': 'MQHkmx2wms0',
  'final293-a-038': 'BnVjI7sEQFo',
  'final293-a-039': 'uDZxY_0NpIQ',
  'final293-a-040': 'Fmrx3a4XnSw',
  'final293-a-041': 'w3V9dfNTWCQ',
  'final293-a-043': 'ZcSSOD4O_uA',
  'final293-a-044': 'CZXLzfZ8G8Y',
  'final293-a-048': 'iCENS1PZfVA',
  'final293-a-050': 'ZC61aYSy8CE',
  'final293-a-052': 'Tq0m4l_s9xY',
  'final293-a-055': 'rUVi9VNDMKM',
  'final293-a-070': '1PasQmK_Hok',
  'final293-a-073': '_qjNpfr6pbo',
  'final293-a-098': 'S-pxX5RFjnY',
  'final293-b-070': 'mZwyarZJkBA',
  'final293-b-113': 'LILmSQCQ6k0',
  'final293-b-114': '9XxeAL4jIO8',
  'final293-b-115': 'OWpKraSbRzw',
  'final293-b-116': 'NbN_vQ-wc2g',
  'final293-b-121': 'oHdh-3jvzNw',
  'final293-b-124': 'kE3KBUMm5ds',
  'final293-b-125': 'AKmM1u1UNAQ',
  'final293-b-126': '8hGdHdpo8o4',
  'final293-b-127': '8qc05IIHNmw',
  'final293-c-001': 'kCJAUfkGYDw',
  'final293-c-002': 'TVik1mCdxVA',
  'final293-c-003': '4GYxfrAc3m4',
  'final293-c-004': 'fgR4NnAp8U8',
  'final293-c-005': '7H4oES3_EMQ',
  'final293-c-006': 'WUYotugozcI',
  'final293-c-008': 'RvdP7rsf-Rw',
  'final293-c-011': 'SoM8Squ-dI8',
  'final293-c-028': 'hr9rxyHSJ60',
  'final293-c-036': 'e1zyEYU_cGs',
  'final293-c-037': 't8dLMXuUrEU',
  'final293-c-038': 'VIF4anxkmVs',
  'final293-c-051': '5Yk_ew0cDgo',
  'final293-c-069': 'p2wUXl08SXk',
  'final293-c-071': 'Ce4LhoqS3AI',
  'final293-c-092': 'UiXJ1GJPU8c',
  'final293-c-095': 'dyExVTog7p4',
  'final293-d-002': 'iIJRIahyA6o',
  'final293-d-004': 'FWSSQBvy4_M',
  'final293-d-005': 'LdndQRchQ5k',
}

const fighterCorrections: Readonly<
  Record<string, Pick<ProVodRecord, 'playerFighterIds' | 'opponentFighterIds'>>
> = {
  'hist6-037': {
    playerFighterIds: ['mr-game-and-watch'],
    opponentFighterIds: ['ridley'],
  },
  'hist6-038': {
    playerFighterIds: ['mr-game-and-watch'],
    opponentFighterIds: ['ridley'],
  },
  'final293-b-070': {
    playerFighterIds: ['pyra', 'mythra'],
    opponentFighterIds: ['rob'],
  },
}

export function applyProVodLinkResolutionBulk11(vod: ProVodRecord): ProVodRecord {
  const youtubeId = proVodYoutubeResolutionsBulk11[vod.id]
  if (!youtubeId) return vod

  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`
  const fighterCorrection = fighterCorrections[vod.id]
  const evidenceNote = vod.id.startsWith('final293-')
    ? 'The direct YouTube target is the canonical verified set for this source-index identity. The acquisition record intentionally collapses player/opponent/source-date duplicates, so no unstored bracket round is inferred; tactical review remains pending.'
    : 'The direct YouTube target was recovered from the documented source identity, including event and round when supplied, player pairing, and visible fighter evidence. No unstored bracket detail is inferred; tactical review remains pending.'

  return {
    ...vod,
    ...(fighterCorrection ?? {}),
    videoUrl,
    videoProvider: 'youtube',
    videoId: youtubeId,
    linkKind: 'direct-video',
    analysisStatus: 'review-queued',
    sourceUrls: [videoUrl, ...vod.sourceUrls.filter((url) => url !== videoUrl)],
    quality: {
      ...vod.quality,
      visibleGameplay: true,
      notes: [...vod.quality.notes, evidenceNote],
    },
  }
}
