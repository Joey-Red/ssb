import { kagaribi15StreamReviewTargets, type ProVodReviewPriority, type ProVodReviewTarget } from './proLabReviewQueue'
import { proVodCatalog } from './proLabVodsAll'

const priorityForCatalogedVod = (date: string, eventTier: string): ProVodReviewPriority => {
  if (date.startsWith('2026-') && eventTier === 'supermajor') return 'critical'
  if (date.startsWith('2026-') || eventTier === 'supermajor' || eventTier === 'major') return 'high'
  return 'normal'
}

/**
 * Source-index acquisitions are real set-discovery records, but they are not
 * ready for direct gameplay review until the stable watch URL is resolved.
 */
export const proVodLinkResolutionQueue = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')

export const proVodLinkResolutionQueueStats = {
  total: proVodLinkResolutionQueue.length,
  currentSeason: proVodLinkResolutionQueue.filter((vod) => vod.date.startsWith('2026-')).length,
  supermajor: proVodLinkResolutionQueue.filter((vod) => vod.eventTier === 'supermajor').length,
  major: proVodLinkResolutionQueue.filter((vod) => vod.eventTier === 'major').length,
  regional: proVodLinkResolutionQueue.filter((vod) => vod.eventTier === 'regional').length,
} as const

export const catalogedProVodReviewTargets: readonly ProVodReviewTarget[] = proVodCatalog
  .filter((vod) => vod.linkKind !== 'source-index')
  .map((vod) => ({
    id: `review-${vod.id}`,
    vodId: vod.id,
    event: vod.event,
    date: vod.date,
    round: vod.round,
    playerTags: [vod.playerId, vod.opponentTag],
    fighterIds: [...vod.playerFighterIds, ...vod.opponentFighterIds],
    videoUrl: vod.videoUrl,
    ...(vod.startSeconds !== undefined ? { setStartSeconds: vod.startSeconds } : {}),
    priority: priorityForCatalogedVod(vod.date, vod.eventTier),
    status: 'vod-cataloged',
    sourceUrls: vod.sourceUrls,
    note: 'Direct VOD metadata is ready. Tactical claims, timestamps inside games, and player intent must be added only after direct footage review.',
  }))

const reviewIdentity = (target: ProVodReviewTarget) =>
  target.vodId
    ? `vod:${target.vodId}`
    : `media:${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`

const mediaIdentity = (target: ProVodReviewTarget) =>
  `media:${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`

const combinedTargets: readonly ProVodReviewTarget[] = [
  ...catalogedProVodReviewTargets,
  ...kagaribi15StreamReviewTargets,
]
const seenVodIds = new Set<string>()
const seenMedia = new Set<string>()

export const proVodReviewQueue: readonly ProVodReviewTarget[] = combinedTargets.filter((target) => {
  const media = mediaIdentity(target)
  if (seenMedia.has(media)) return false
  if (target.vodId && seenVodIds.has(target.vodId)) return false
  seenMedia.add(media)
  if (target.vodId) seenVodIds.add(target.vodId)
  return true
})

export const proVodReviewQueueStats = {
  totalTargets: proVodReviewQueue.length,
  critical: proVodReviewQueue.filter((target) => target.priority === 'critical').length,
  high: proVodReviewQueue.filter((target) => target.priority === 'high').length,
  normal: proVodReviewQueue.filter((target) => target.priority === 'normal').length,
  reviewed: proVodReviewQueue.filter((target) => target.status === 'reviewed').length,
  pending: proVodReviewQueue.filter((target) => target.status !== 'reviewed').length,
  identityCount: new Set(proVodReviewQueue.map(reviewIdentity)).size,
} as const
