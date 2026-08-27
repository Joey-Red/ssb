import { useMemo, useState } from 'react'
import { proPlayerRepresentatives, proSetBreakdowns, proTemporalEvidence } from '../data/proLab'
import type { ProPlayerRepresentative, ProVodRecord } from '../data/proLabTypes'
import { getProVodsForFighter } from '../data/proLabVodsAll'
import { roster } from '../data/roster'
import type { FighterManifestEntry } from '../types'

const playerById = new Map<string, ProPlayerRepresentative>(proPlayerRepresentatives.map((player) => [player.id, player]))
const fighterById = new Map<string, FighterManifestEntry>(roster.map((fighter) => [fighter.id, fighter]))
const temporalByVod = new Map(proTemporalEvidence.map((entry) => [entry.vodId, entry]))
const breakdownByVod = new Map(proSetBreakdowns.map((entry) => [entry.vodId, entry]))

const tiers = ['all', 'supermajor', 'major', 'regional', 'invitational', 'weekly', 'unknown'] as const
const eras = ['all', 'current', 'recent', 'legacy'] as const
const statuses = ['all', 'review-queued', 'cataloged', 'annotated', 'reviewed'] as const
const sorts = ['newest', 'oldest', 'quality'] as const

type TierFilter = (typeof tiers)[number]
type EraFilter = (typeof eras)[number]
type StatusFilter = (typeof statuses)[number]
type SortMode = (typeof sorts)[number]

export function ProVodLibrary({ fighterId }: { fighterId: string }) {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<TierFilter>('all')
  const [era, setEra] = useState<EraFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortMode>('newest')

  const vods = useMemo(() => getProVodsForFighter(fighterId), [fighterId])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return vods
      .filter((vod) => {
        if (tier !== 'all' && vod.eventTier !== tier) return false
        const vodEra = temporalByVod.get(vod.id)?.era ?? 'legacy'
        if (era !== 'all' && vodEra !== era) return false
        if (status !== 'all' && vod.analysisStatus !== status) return false
        if (!query) return true
        const player = playerById.get(vod.playerId)?.tag ?? vod.playerId
        const fighterNames = [...vod.playerFighterIds, ...vod.opponentFighterIds]
          .map((id) => fighterById.get(id)?.name ?? id)
          .join(' ')
        return [vod.title, vod.event, vod.round, vod.opponentTag, player, fighterNames, vod.date]
          .some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        if (sort === 'oldest') return a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
        if (sort === 'quality') return b.quality.score - a.quality.score || b.date.localeCompare(a.date)
        return b.date.localeCompare(a.date) || b.quality.score - a.quality.score
      })
  }, [era, search, sort, status, tier, vods])

  const opponentCount = new Set(vods.map((vod) => vod.opponentTag.toLowerCase())).size
  const currentCount = vods.filter((vod) => temporalByVod.get(vod.id)?.era === 'current').length

  return <section className="panel pro-lab__vod-library">
    <div className="section-heading">
      <div><p className="eyebrow">Sets</p><h2>Tournament VOD library</h2></div>
      <span className="section-meta">{vods.length} sets · {opponentCount} opponents · {currentCount} current</span>
    </div>

    {vods.length ? <>
      <div className="pro-lab__vod-toolbar" aria-label="VOD library filters">
        <label className="pro-lab__vod-search"><span>Search sets</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Player, opponent, event, character, round…" /></label>
        <label><span>Tier</span><select value={tier} onChange={(event) => setTier(event.target.value as TierFilter)}>{tiers.map((value) => <option value={value} key={value}>{value === 'all' ? 'All tiers' : value}</option>)}</select></label>
        <label><span>Era</span><select value={era} onChange={(event) => setEra(event.target.value as EraFilter)}>{eras.map((value) => <option value={value} key={value}>{value === 'all' ? 'All eras' : value}</option>)}</select></label>
        <label><span>Review</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>{statuses.map((value) => <option value={value} key={value}>{value === 'all' ? 'All states' : value}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>{sorts.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>
      <div className="pro-lab__vod-summary"><strong>{filtered.length}</strong><span>of {vods.length} sets shown</span>{filtered.length !== vods.length && <button type="button" onClick={() => { setSearch(''); setTier('all'); setEra('all'); setStatus('all'); setSort('newest') }}>Clear filters</button>}</div>
      {filtered.length ? <div className="pro-lab__vod-list">{filtered.map((vod) => <VodCard key={vod.id} vod={vod} fighterId={fighterId} />)}</div> : <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>No sets match these filters</h3><p>Clear or broaden the VOD filters. The underlying fighter library still contains {vods.length} cataloged sets.</p></div></div>}
    </> : <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>VOD research queued</h3><p>This fighter has no catalog-quality set yet; the gap remains visible until source-backed footage is added.</p></div></div>}
  </section>
}

function VodCard({ vod, fighterId }: { vod: ProVodRecord; fighterId: string }) {
  const player = playerById.get(vod.playerId)?.tag ?? vod.playerId
  const playerCharacters = fighterNames(vod.playerFighterIds)
  const opponentCharacters = fighterNames(vod.opponentFighterIds)
  const era = temporalByVod.get(vod.id)?.era ?? 'legacy'
  const selectedSide = vod.playerFighterIds.includes(fighterId) ? 'studied player' : 'opponent-side footage'
  const playbackUrl = withStartTime(vod.videoUrl, vod.startSeconds)
  const startLabel = vod.startSeconds === undefined ? null : formatTimestamp(vod.startSeconds)
  const sourceIndexed = vod.linkKind === 'source-index'
  const dateLabel = vod.datePrecision === 'event-anchor' ? `event date ${vod.date}` : vod.date
  const actionLabel = sourceIndexed ? 'Find VOD ↗' : startLabel ? 'Open at set ↗' : 'Open VOD ↗'

  return <article className="pro-lab__vod">
    <div className="pro-lab__vod-main">
      <div className="pro-lab__card-top"><h3>{vod.title}</h3><span>{era}</span></div>
      <p className="pro-lab__vod-matchup"><strong>{player}</strong> · {playerCharacters || 'character unverified'} <span>vs.</span> <strong>{vod.opponentTag}</strong> · {opponentCharacters || 'character unverified'}</p>
      <p>{dateLabel} · {vod.round} · {vod.eventTier}{startLabel ? ` · starts ${startLabel}` : ''}</p>
      <p>{vod.result ?? 'Result not asserted.'}</p>
      <div className="pro-lab__status-row"><span>{selectedSide}</span>{sourceIndexed && <span>source index · direct link pending</span>}<span>Quality {vod.quality.score}</span><span>{vod.analysisStatus}</span><span>Version {vod.gameVersion}</span><span>Breakdown {breakdownByVod.get(vod.id)?.status ?? 'queued'}</span></div>
    </div>
    <div className="pro-lab__vod-actions"><a className="button-link" href={playbackUrl} target="_blank" rel="noreferrer">{actionLabel}</a><details><summary>Provenance</summary><div className="pro-lab__source-stack">{vod.sourceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}>{url}</a>)}</div></details></div>
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
