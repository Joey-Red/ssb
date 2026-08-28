import type {
  ProFighterCoverage,
  ProPlayerRepresentative,
  ProVodRecord,
} from '../data/proLabTypes'
import type { ProIndexedCoverageSet } from '../data/proLabIndexedCoverageDepth'

const DAY_MS = 86_400_000
const normalizeTag = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
const dateValue = (value: string) => {
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) ? timestamp : null
}

export const proCoverageSetIdentity = (playerTag: string, opponentTag: string, date: string) =>
  `${[normalizeTag(playerTag), normalizeTag(opponentTag)].sort().join('|')}|${date}`

export function selectUniqueIndexedCoverageSets(
  vods: readonly ProVodRecord[],
  players: readonly ProPlayerRepresentative[],
  indexedSets: readonly ProIndexedCoverageSet[],
) {
  const playerTagById = new Map(players.map((player) => [player.id, player.tag]))
  const seen = new Set<string>()
  for (const vod of vods) {
    const playerTag = playerTagById.get(vod.playerId)
    if (!playerTag) continue
    seen.add(proCoverageSetIdentity(playerTag, vod.opponentTag, vod.date))
  }

  const accepted: ProIndexedCoverageSet[] = []
  const duplicateIds: string[] = []
  for (const indexed of indexedSets) {
    const identity = proCoverageSetIdentity(indexed.playerTag, indexed.opponentTag, indexed.date)
    if (seen.has(identity)) {
      duplicateIds.push(indexed.id)
      continue
    }
    seen.add(identity)
    accepted.push(indexed)
  }
  return { accepted, duplicateIds } as const
}

export function indexedSetIsCurrent(set: ProIndexedCoverageSet, referenceDate: string) {
  const event = dateValue(set.date)
  const reference = dateValue(referenceDate)
  if (event === null || reference === null || event > reference) return false
  return Math.floor((reference - event) / DAY_MS) <= 730
}

/**
 * Indexed match-video entries deepen roster planning only. They never enter the
 * direct-footage review registry, tactical extraction, lessons, or comparison
 * pipeline. Fighter labels must be explicit in the public index title before an
 * entry is checked in.
 */
export function applyIndexedCoverageDepth(
  coverage: readonly ProFighterCoverage[],
  indexedSets: readonly ProIndexedCoverageSet[],
  referenceDate: string,
): readonly ProFighterCoverage[] {
  return coverage.map((entry) => {
    const indexedForFighter = indexedSets.filter((set) =>
      set.playerFighterIds.includes(entry.fighterId) || set.opponentFighterIds.includes(entry.fighterId),
    )
    if (indexedForFighter.length === 0) return entry
    const currentIndexedCount = indexedForFighter.filter((set) => indexedSetIsCurrent(set, referenceDate)).length
    const notes = [...entry.notes]
    notes.push(`${indexedForFighter.length} additional public match-video index entr${indexedForFighter.length === 1 ? 'y' : 'ies'} deepen coverage planning; direct watch links still require resolution before review.`)
    return {
      ...entry,
      state: entry.state === 'research-queued' || entry.state === 'representative-seeded' ? 'cataloged' : entry.state,
      vodCount: entry.vodCount + indexedForFighter.length,
      currentVodCount: entry.currentVodCount + currentIndexedCount,
      notes,
    }
  })
}
