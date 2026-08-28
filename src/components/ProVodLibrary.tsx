import { useMemo, useState } from 'react'
import { proPlayerRepresentatives, proSetBreakdowns, proTemporalEvidence, proVodCatalog } from '../data/proLab'
import type { ProPlayerRepresentative, ProTemporalEvidence, ProVodRecord } from '../data/proLabTypes'
import { roster } from '../data/roster'
import {
  buildFighterVodFilterOptions,
  filterAndSortFighterVods,
  fighterStudySide,
  type ProVodLibraryEraFilter,
  type ProVodLibraryLinkFilter,
  type ProVodLibrarySideFilter,
  type ProVodLibrarySortMode,
  type ProVodLibraryStatusFilter,
  type ProVodLibraryTierFilter,
} from '../lib/proLabVodLibrary'
import { hrefFor } from '../router'
import type { FighterManifestEntry } from '../types'

const playerById = new Map<string, ProPlayerRepresentative>(proPlayerRepresentatives.map((player) => [player.id, player]))
const fighterById = new Map<string, FighterManifestEntry>(roster.map((fighter) => [fighter.id, fighter]))
const temporalByVod = new Map<string, ProTemporalEvidence>(proTemporalEvidence.map((entry) => [entry.vodId, entry]))
const breakdownByVod = new Map(proSetBreakdowns.map((entry) => [entry.vodId, entry]))

const tiers: readonly ProVodLibraryTierFilter[] = ['all', 'supermajor', 'major', 'regional', 'invitational', 'weekly', 'unknown']
const eras: readonly ProVodLibraryEraFilter[] = ['all', 'current', 'recent', 'legacy']
const statuses: readonly ProVodLibraryStatusFilter[] = ['all', 'review-queued', 'cataloged', 'annotated', 'reviewed']
const sides: readonly ProVodLibrarySideFilter[] = ['all', 'studied-player', 'opponent-side']
const links: readonly ProVodLibraryLinkFilter[] = ['all', 'direct-video', 'source-index']
const sorts: readonly ProVodLibrarySortMode[] = ['recommended', 'newest', 'oldest', 'quality']

const includesFighter = (vod: ProVodRecord, fighterId: string) =>
  vod.playerFighterIds.includes(fighterId) || vod.opponentFighterIds.includes(fighterId)

export function ProVodLibrary({ fighterId }: { fighterId: string }) {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<ProVodLibraryTierFilter>('all')
  const [era, setEra] = useState<ProVodLibraryEraFilter>('all')
  const [status, setStatus] = useState<ProVodLibraryStatusFilter>('all')
  const [side, setSide] = useState<ProVodLibrarySideFilter>('all')
  const [link, setLink] = useState<ProVodLibraryLinkFilter>('all')
  const [playerId, setPlayerId] = useState('all')
  const [opponentFighterId, setOpponentFighterId] = useState('all')
  const [year, setYear] = useState('all')
  const [sort, setSort] = useState<ProVodLibrarySortMode>('recommended')

  const vods = useMemo(() => proVodCatalog.filter((vod) => includesFighter(vod, fighterId)), [fighterId])
  const options = useMemo(() => buildFighterVodFilterOptions(vods, fighterId), [fighterId, vods])
  const activePlayerId = playerId === 'all' || options.playerIds.includes(playerId) ? playerId : 'all'
  const activeOpponentFighterId = opponentFighterId === 'all' || options.opponentFighterIds.includes(opponentFighterId) ? opponentFighterId : 'all'
  const activeYear = year === 'all' || options.years.includes(year) ? year : 'all'
  const filtered = useMemo(() => filterAndSortFighterVods(
    vods,
    fighterId,
    temporalByVod,
    { search, tier, era, status, side, link, playerId: activePlayerId, opponentFighterId: activeOpponentFighterId, year: activeYear, sort },
    (vod) => {
      const player = playerById.get(vod.playerId)?.tag ?? vod.playerId
      const fighterNames = [...vod.playerFighterIds, ...vod.opponentFighterIds]
        .map((id) => fighterById.get(id)?.name ?? id)
        .join(' ')
      return [vod.title, vod.event, vod.round, vod.opponentTag, player, fighterNames, vod.date]
    },
  ), [activeOpponentFighterId, activePlayerId, activeYear, era, fighterId, link, search, side, sort, status, tier, vods])

  const opponentCount = new Set(vods.map((vod) => vod.opponentTag.toLowerCase())).size
  const currentCount = vods.filter((vod) => temporalByVod.get(vod.id)?.era === 'current').length
  const reviewReadyCount = vods.filter((vod) => vod.analysisStatus !== 'reviewed' && vod.linkKind !== 'source-index' && vod.quality.visibleGameplay).length
  const hasFilters = search !== '' || tier !== 'all' || era !== 'all' || status !== 'all' || side !== 'all' || link !== 'all' || activePlayerId !== 'all' || activeOpponentFighterId !== 'all' || activeYear !== 'all' || sort !== 'recommended'
  const clearFilters = () => {
    setSearch('')
    setTier('all')
    setEra('all')
    setStatus('all')
    setSide('all')
    setLink('all')
    setPlayerId('all')
    setOpponentFighterId('all')
    setYear('all')
    setSort('recommended')
  }

  return <section className="panel pro-lab__vod-library">
    <div className="section-heading">
      <div><p className="eyebrow">Sets</p><h2>Tournament VOD library</h2></div>
      <span className="section-meta">{vods.length} sets · {opponentCount} opponents · {currentCount} current · {reviewReadyCount} review-ready</span>
    </div>

    {vods.length ? <>
      <div className="pro-lab__vod-toolbar" aria-label="VOD library filters">
        <label className="pro-lab__vod-search"><span>Search sets</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Player, opponent, event, character, round…" /></label>
        <label><span>Tier</span><select value={tier} onChange={(event) => setTier(event.target.value as ProVodLibraryTierFilter)}>{tiers.map((value) => <option value={value} key={value}>{value === 'all' ? 'All tiers' : value}</option>)}</select></label>
        <label><span>Era</span><select value={era} onChange={(event) => setEra(event.target.value as ProVodLibraryEraFilter)}>{eras.map((value) => <option value={value} key={value}>{value === 'all' ? 'All eras' : value}</option>)}</select></label>
        <label><span>Review</span><select value={status} onChange={(event) => setStatus(event.target.value as ProVodLibraryStatusFilter)}>{statuses.map((value) => <option value={value} key={value}>{value === 'all' ? 'All states' : value}</option>)}</select></label>
        <label><span>Study side</span><select value={side} onChange={(event) => setSide(event.target.value as ProVodLibrarySideFilter)}>{sides.map((value) => <option value={value} key={value}>{value === 'all' ? 'Either side' : value === 'studied-player' ? 'Cataloged player side' : 'Opponent side'}</option>)}</select></label>
        <label><span>Link</span><select value={link} onChange={(event) => setLink(event.target.value as ProVodLibraryLinkFilter)}>{links.map((value) => <option value={value} key={value}>{value === 'all' ? 'All links' : value === 'direct-video' ? 'Direct video' : 'Source index'}</option>)}</select></label>
        <label><span>Cataloged player</span><select value={activePlayerId} onChange={(event) => setPlayerId(event.target.value)}><option value="all">All players</option>{options.playerIds.map((id) => <option value={id} key={id}>{playerById.get(id)?.tag ?? id}</option>)}</select></label>
        <label><span>Opponent fighter</span><select value={activeOpponentFighterId} onChange={(event) => setOpponentFighterId(event.target.value)}><option value="all">All matchups</option>{options.opponentFighterIds.map((id) => <option value={id} key={id}>{fighterById.get(id)?.name ?? id}</option>)}</select></label>
        <label><span>Year</span><select value={activeYear} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{options.years.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as ProVodLibrarySortMode)}>{sorts.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>
      <div className="pro-lab__vod-summary"><strong>{filtered.length}</strong><span>of {vods.length} sets shown</span>{hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}</div>
      {filtered.length ? <div className="pro-lab__vod-list">{filtered.map((vod) => <VodCard key={vod.id} vod={vod} fighterId={fighterId} />)}</div> : <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>No sets match these filters</h3><p>Clear or broaden the VOD filters. The underlying fighter library still contains {vods.length} cataloged sets.</p></div></div>}
    </> : <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>VOD research queued</h3><p>This fighter has no catalog-quality set yet; the gap remains visible until source-backed footage is added.</p></div></div>}
  </section>
}

function VodCard({ vod, fighterId }: { vod: ProVodRecord; fighterId: string }) {
  const player = playerById.get(vod.playerId)?.tag ?? vod.playerId
  const playerCharacters = fighterNames(vod.playerFighterIds)
  const opponentCharacters = fighterNames(vod.opponentFighterIds)
  const era = temporalByVod.get(vod.id)?.era ?? 'legacy'
  const selectedSide = fighterStudySide(vod, fighterId) === 'studied-player' ? 'studied player' : 'opponent-side footage'
  const playbackUrl = withStartTime(vod.videoUrl, vod.startSeconds)
  const startLabel = vod.startSeconds === undefined ? null : formatTimestamp(vod.startSeconds)
  const sourceIndexed = vod.linkKind === 'source-index'
  const reviewReady = !sourceIndexed && vod.quality.visibleGameplay && vod.analysisStatus !== 'reviewed'
  const dateLabel = vod.datePrecision === 'event-anchor' ? `event date ${vod.date}` : vod.date
  const actionLabel = sourceIndexed ? 'Find VOD ↗' : startLabel ? 'Open at set ↗' : 'Open VOD ↗'

  return <article className="pro-lab__vod">
    <div className="pro-lab__vod-main">
      <div className="pro-lab__card-top"><h3>{vod.title}</h3><span>{era}</span></div>
      <p className="pro-lab__vod-matchup"><strong>{player}</strong> · {playerCharacters || 'character unverified'} <span>vs.</span> <strong>{vod.opponentTag}</strong> · {opponentCharacters || 'character unverified'}</p>
      <p>{dateLabel} · {vod.round} · {vod.eventTier}{startLabel ? ` · starts ${startLabel}` : ''}</p>
      <p>{vod.result ?? 'Result not asserted.'}</p>
      <div className="pro-lab__status-row"><span>{selectedSide}</span><span>{reviewReady ? 'review ready' : sourceIndexed ? 'link recovery needed' : vod.analysisStatus === 'reviewed' ? 'review complete' : 'not reviewable'}</span><span>Quality {vod.quality.score}</span><span>{vod.analysisStatus}</span><span>Version {vod.gameVersion}</span><span>Breakdown {breakdownByVod.get(vod.id)?.status ?? 'queued'}</span></div>
    </div>
    <div className="pro-lab__vod-actions"><a className="button-link" href={playbackUrl} target="_blank" rel="noreferrer">{actionLabel}</a>{reviewReady && <a className="button-link" href={hrefFor(`/pro-lab/review/${encodeURIComponent(vod.id)}`)}>Review evidence</a>}<details><summary>Provenance</summary><div className="pro-lab__source-stack">{vod.sourceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}>{url}</a>)}</div></details></div>
  </article>
}

function fighterNames(ids: readonly string[]) {
  return ids.map((id) => fighterById.get(id)?.name ?? id).join(' / ')
}

function withStartTime(url: string, seconds: number | undefined) {
  if (seconds === undefined) return url
  return `${url}${url.includes('?') ? '&' : '?'}t=${Math.max(0, Math.floor(seconds))}s`
}

function formatTimestamp(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}
