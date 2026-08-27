import type { ProVodRecord } from './proLabTypes'
import { proVodFinal293CandidatesA } from './proLabVodsFinal293CandidatesA'
import { proVodFinal293CandidatesB } from './proLabVodsFinal293CandidatesB'
import { proVodFinal293CandidatesC } from './proLabVodsFinal293CandidatesC'
import { proVodFinal293CandidatesD } from './proLabVodsFinal293CandidatesD'

export const proVodFinal293Candidates = [
  ...proVodFinal293CandidatesA,
  ...proVodFinal293CandidatesB,
  ...proVodFinal293CandidatesC,
  ...proVodFinal293CandidatesD,
] as readonly ProVodRecord[]

const normalizeOpponentTag = (tag: string) => tag.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')

/**
 * Conservative source-index identity used for the final acquisition pass.
 *
 * Player + opponent + source-date anchor intentionally collapses mirrored uploads,
 * repeated index rows, and bracket-label variants from the same day. That can
 * under-count a rare same-day runback, but it is preferable to padding the study
 * corpus with duplicates while exact watch URLs remain unresolved.
 */
export const proVodAcquisitionIdentity = (vod: ProVodRecord) =>
  `${vod.playerId}|${normalizeOpponentTag(vod.opponentTag)}|${vod.date}`

export function selectProVodAcquisitionBatch(
  existing: readonly ProVodRecord[],
  candidates: readonly ProVodRecord[],
  limit: number,
): readonly ProVodRecord[] {
  const seen = new Set(existing.map(proVodAcquisitionIdentity))
  const selected: ProVodRecord[] = []

  for (const candidate of candidates) {
    const identity = proVodAcquisitionIdentity(candidate)
    if (seen.has(identity)) continue
    seen.add(identity)
    selected.push(candidate)
    if (selected.length === limit) break
  }

  return selected
}
