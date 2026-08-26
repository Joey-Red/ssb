import { kagaribi15StreamReviewTargets, type ProVodReviewPriority, type ProVodReviewTarget } from './proLabReviewQueue'
import { proVodCatalog } from './proLabVodsAll'

const priorityForCatalogedVod = (date: string, eventTier: string): ProVodReviewPriority => {
  if (date.startsWith('2026-') && eventTier === 'supermajor') return 'critical'
  if (date.startsWith('2026-') || eventTier === 'supermajor' || eventTier === 'major') return 'high'
  return 'normal'
}

export const catalogedProVodReviewTargets: readonly ProVodReviewTarget[] = proVodCatalog.map((vod) => ({
  id: `review-${vod.id}`,
  vodId: vod.id,
  event: vod.event,
  date: vod.date,
  round: vod.round,
  playerTags: [vod.playerId, vod.opponentTag],
  fighterIds: [...vod.playerFighterIds, ...vod.opponentFighterIds],
  videoUrl: vod.videoUrl,
  setStartSeconds: vod.startSeconds,
  priority: priorityForCatalogedVod(vod.date, vod.eventTier),
  status: 'vod-cataloged',
  sourceUrls: vod.sourceUrls,
  note: 'Catalog metadata is ready. Tactical claims, timestamps inside games, and player intent must be added only after direct footage review.',
}))

const reviewIdentity = (target: ProVodReviewTarget) =>
  target.vodId
    ? `vod:${target.vodId}`
    : `media:${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`

const mediaIdentity = (target: ProVodReviewTarget) =>
  `media:${target.videoUrl}|${target.setStartSeconds ?? 'full-set'}`

const combinedTargets = [...catalogedProVodReviewTargets, ...kagaribi15StreamReviewTargets]
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
