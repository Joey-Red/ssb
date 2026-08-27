import type { ProEvidenceEra, ProTemporalEvidence, ProVodEventTier, ProVodRecord } from '../data/proLabTypes'

export type ProVodLibraryTierFilter = ProVodEventTier | 'all'
export type ProVodLibraryEraFilter = ProEvidenceEra | 'all'
export type ProVodLibraryStatusFilter = ProVodRecord['analysisStatus'] | 'all'
export type ProVodLibrarySideFilter = 'all' | 'studied-player' | 'opponent-side'
export type ProVodLibraryLinkFilter = 'all' | 'direct-video' | 'source-index'
export type ProVodLibrarySortMode = 'recommended' | 'newest' | 'oldest' | 'quality'

export interface ProVodLibraryFilters {
  readonly search: string
  readonly tier: ProVodLibraryTierFilter
  readonly era: ProVodLibraryEraFilter
  readonly status: ProVodLibraryStatusFilter
  readonly side: ProVodLibrarySideFilter
  readonly link: ProVodLibraryLinkFilter
  readonly playerId: string
  readonly opponentFighterId: string
  readonly year: string
  readonly sort: ProVodLibrarySortMode
}

export interface ProVodLibraryFilterOptions {
  readonly playerIds: readonly string[]
  readonly opponentFighterIds: readonly string[]
  readonly years: readonly string[]
}

const tierWeight: Readonly<Record<ProVodEventTier, number>> = {
  supermajor: 6,
  major: 5,
  regional: 4,
  invitational: 3,
  weekly: 2,
  unknown: 1,
}

const eraWeight: Readonly<Record<ProEvidenceEra, number>> = {
  current: 3,
  recent: 2,
  legacy: 1,
}

const statusWeight: Readonly<Record<ProVodRecord['analysisStatus'], number>> = {
  annotated: 4,
  'review-queued': 3,
  cataloged: 2,
  reviewed: 0,
}

export const fighterStudySide = (vod: ProVodRecord, fighterId: string): Exclude<ProVodLibrarySideFilter, 'all'> =>
  vod.playerFighterIds.includes(fighterId) ? 'studied-player' : 'opponent-side'

export const relativeOpponentFighterIds = (vod: ProVodRecord, fighterId: string): readonly string[] =>
  fighterStudySide(vod, fighterId) === 'studied-player' ? vod.opponentFighterIds : vod.playerFighterIds

export function buildFighterVodFilterOptions(
  vods: readonly ProVodRecord[],
  fighterId: string,
): ProVodLibraryFilterOptions {
  return {
    playerIds: [...new Set(vods.map((vod) => vod.playerId))].sort(),
    opponentFighterIds: [...new Set(vods.flatMap((vod) => relativeOpponentFighterIds(vod, fighterId)))].sort(),
    years: [...new Set(vods.map((vod) => vod.date.slice(0, 4)).filter((year) => /^\d{4}$/.test(year)))].sort().reverse(),
  }
}

const recommendationScore = (
  vod: ProVodRecord,
  fighterId: string,
  temporalByVod: ReadonlyMap<string, ProTemporalEvidence>,
) => {
  const era = temporalByVod.get(vod.id)?.era ?? 'legacy'
  const directVisible = vod.linkKind !== 'source-index' && vod.quality.visibleGameplay
  return statusWeight[vod.analysisStatus] * 1000
    + (directVisible ? 700 : 0)
    + eraWeight[era] * 180
    + tierWeight[vod.eventTier] * 70
    + Math.max(0, Math.min(100, vod.quality.score))
    + (fighterStudySide(vod, fighterId) === 'studied-player' ? 45 : 0)
}

export function filterAndSortFighterVods(
  vods: readonly ProVodRecord[],
  fighterId: string,
  temporalByVod: ReadonlyMap<string, ProTemporalEvidence>,
  filters: ProVodLibraryFilters,
  searchValues: (vod: ProVodRecord) => readonly string[],
): readonly ProVodRecord[] {
  const query = filters.search.trim().toLowerCase()

  return vods
    .filter((vod) => {
      if (filters.tier !== 'all' && vod.eventTier !== filters.tier) return false
      const vodEra = temporalByVod.get(vod.id)?.era ?? 'legacy'
      if (filters.era !== 'all' && vodEra !== filters.era) return false
      if (filters.status !== 'all' && vod.analysisStatus !== filters.status) return false
      if (filters.side !== 'all' && fighterStudySide(vod, fighterId) !== filters.side) return false
      const linkKind = vod.linkKind ?? 'direct-video'
      if (filters.link !== 'all' && linkKind !== filters.link) return false
      if (filters.playerId !== 'all' && vod.playerId !== filters.playerId) return false
      if (filters.opponentFighterId !== 'all' && !relativeOpponentFighterIds(vod, fighterId).includes(filters.opponentFighterId)) return false
      if (filters.year !== 'all' && !vod.date.startsWith(`${filters.year}-`)) return false
      if (!query) return true
      return searchValues(vod).some((value) => value.toLowerCase().includes(query))
    })
    .sort((a, b) => {
      if (filters.sort === 'oldest') return a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
      if (filters.sort === 'quality') return b.quality.score - a.quality.score || b.date.localeCompare(a.date)
      if (filters.sort === 'newest') return b.date.localeCompare(a.date) || b.quality.score - a.quality.score
      return recommendationScore(b, fighterId, temporalByVod) - recommendationScore(a, fighterId, temporalByVod)
        || b.date.localeCompare(a.date)
        || b.quality.score - a.quality.score
        || a.id.localeCompare(b.id)
    })
}
