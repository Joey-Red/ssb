import { describe, expect, it } from 'vitest'
import type { ProTemporalEvidence, ProVodRecord } from '../data/proLabTypes'
import {
  buildFighterVodFilterOptions,
  filterAndSortFighterVods,
  fighterStudySide,
  relativeOpponentFighterIds,
  type ProVodLibraryFilters,
} from './proLabVodLibrary'

const makeVod = (
  id: string,
  date: string,
  playerFighterIds: readonly string[],
  opponentFighterIds: readonly string[],
  overrides: Partial<ProVodRecord> = {},
): ProVodRecord => ({
  id,
  title: id,
  playerId: `player-${id}`,
  playerFighterIds,
  opponentTag: `Opponent ${id}`,
  opponentFighterIds,
  event: 'Test Major',
  eventTier: 'major',
  date,
  round: 'Top 8',
  videoUrl: `https://www.youtube.com/watch?v=${id}`,
  videoProvider: 'youtube',
  linkKind: 'direct-video',
  gameVersion: '13.0.1',
  sourceUrls: [`https://www.youtube.com/watch?v=${id}`],
  analysisStatus: 'review-queued',
  quality: {
    tournamentEnvironment: true,
    fullSet: true,
    officialOrTournamentChannel: true,
    visibleGameplay: true,
    patchKnown: true,
    score: 90,
    notes: [],
  },
  ...overrides,
})

const temporal = (vodId: string, era: ProTemporalEvidence['era']): ProTemporalEvidence => ({
  vodId,
  era,
  eventDate: '2026-01-01',
  gameVersion: '13.0.1',
  playerStatus: 'active',
  reasons: [],
})

const defaults: ProVodLibraryFilters = {
  search: '',
  tier: 'all',
  era: 'all',
  status: 'all',
  side: 'all',
  link: 'all',
  playerId: 'all',
  opponentFighterId: 'all',
  year: 'all',
  sort: 'recommended',
}

describe('Pro Lab VOD library helpers', () => {
  const vods = [
    makeVod('a', '2026-07-01', ['pyra', 'mythra'], ['cloud'], { eventTier: 'supermajor', quality: { ...makeVod('x', '2026-01-01', ['pyra'], ['fox']).quality, score: 98 } }),
    makeVod('b', '2025-05-01', ['fox'], ['pyra', 'mythra'], { analysisStatus: 'cataloged' }),
    makeVod('c', '2024-04-01', ['pyra'], ['samus'], { linkKind: 'source-index', quality: { ...makeVod('y', '2026-01-01', ['pyra'], ['fox']).quality, visibleGameplay: false, score: 60 }, analysisStatus: 'cataloged' }),
  ]
  const temporalByVod = new Map<string, ProTemporalEvidence>([
    ['a', temporal('a', 'current')],
    ['b', temporal('b', 'current')],
    ['c', temporal('c', 'recent')],
  ])

  it('resolves study side and the fighter-relative opponent correctly', () => {
    expect(fighterStudySide(vods[0]!, 'pyra')).toBe('studied-player')
    expect(relativeOpponentFighterIds(vods[0]!, 'pyra')).toEqual(['cloud'])
    expect(fighterStudySide(vods[1]!, 'pyra')).toBe('opponent-side')
    expect(relativeOpponentFighterIds(vods[1]!, 'pyra')).toEqual(['fox'])
  })

  it('builds explicit player, opponent and year filter options', () => {
    const options = buildFighterVodFilterOptions(vods, 'pyra')
    expect(options.opponentFighterIds).toEqual(['cloud', 'fox', 'samus'])
    expect(options.years).toEqual(['2026', '2025', '2024'])
    expect(options.playerIds).toHaveLength(3)
  })

  it('supports side, opponent, direct-link and year filtering', () => {
    const filtered = filterAndSortFighterVods(vods, 'pyra', temporalByVod, {
      ...defaults,
      side: 'studied-player',
      link: 'direct-video',
      opponentFighterId: 'cloud',
      year: '2026',
    }, (vod) => [vod.title, vod.event])

    expect(filtered.map((vod) => vod.id)).toEqual(['a'])
  })

  it('recommends review-ready current high-quality footage ahead of source indexes', () => {
    const filtered = filterAndSortFighterVods(vods, 'pyra', temporalByVod, defaults, (vod) => [vod.title])
    expect(filtered[0]?.id).toBe('a')
    expect(filtered.at(-1)?.id).toBe('c')
  })
})
