import type { ProMaintenanceFinding, ProMaintenanceReport, ProTemporalEvidence, ProVodRecord } from '../data/proLabTypes'
import { auditProLabCatalog } from './proLabRelease'

/**
 * Extends the structural audit for large multi-set tournament streams.
 * A single broadcast URL can legitimately contain many different sets, so a
 * navigation coordinate/opponent/round is part of the learning-record identity.
 * Fighter catalog coverage also counts confirmed appearances on either side.
 */
export function auditExpandedProLabCatalog(
  vods: readonly ProVodRecord[],
  fighterIds: readonly string[],
  temporal: readonly ProTemporalEvidence[],
  referenceDate: string,
): ProMaintenanceReport {
  const base = auditProLabCatalog(vods, fighterIds, temporal, referenceDate)
  const duplicateLearningRecords: string[] = []
  const seen = new Map<string, string>()

  for (const vod of vods) {
    const identity = [
      vod.playerId,
      vod.videoUrl,
      vod.startSeconds ?? 'full-set',
      [...vod.playerFighterIds].sort().join(','),
      vod.opponentTag.toLowerCase(),
      [...vod.opponentFighterIds].sort().join(','),
      vod.round.toLowerCase(),
    ].join('|')
    if (seen.has(identity)) duplicateLearningRecords.push(vod.id)
    else seen.set(identity, vod.id)
  }

  const fightersWithVods = new Set(vods.flatMap((vod) => [...vod.playerFighterIds, ...vod.opponentFighterIds]))
  const fightersWithoutCatalogedVods = fighterIds.filter((fighterId) => !fightersWithVods.has(fighterId))
  const findings: ProMaintenanceFinding[] = base.findings.filter((finding) => finding.code !== 'duplicate-learning-record' && finding.code !== 'fighter-catalog-gap')

  if (duplicateLearningRecords.length) findings.push({
    code: 'duplicate-learning-record',
    severity: 'error',
    message: `${duplicateLearningRecords.length} duplicate set record(s) found after stream-coordinate disambiguation.`,
    ids: duplicateLearningRecords,
  })
  if (fightersWithoutCatalogedVods.length) findings.push({
    code: 'fighter-catalog-gap',
    severity: 'info',
    message: `${fightersWithoutCatalogedVods.length} fighters need catalog evidence.`,
    ids: fightersWithoutCatalogedVods,
  })

  return { ...base, findings, duplicateLearningRecords, fightersWithoutCatalogedVods }
}
