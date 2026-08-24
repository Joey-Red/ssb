import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { guideByFighterId } from '../data/allGuides'
import { fighterById, roster } from '../data/roster'
import { clearLocalData, useLocalState } from '../lib/storage'
import { hrefFor } from '../router'
import './RosterView.css'

export function RosterView() {
  const [query, setQuery] = useState('')
  const [series, setSeries] = useState('all')
  const [archetype, setArchetype] = useState('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const refs = useRef<(HTMLAnchorElement | null)[]>([])
  const localState = useLocalState()

  const normalized = query.trim().toLowerCase()
  const seriesOptions = useMemo(() => [...new Set(roster.map((fighter) => fighter.series))].sort(), [])
  const archetypeOptions = useMemo(() => {
    const values = roster.flatMap((fighter) => {
      const guide = guideByFighterId.get(fighter.id)
      return guide ? [guide.archetype.split(' · ')[0] ?? guide.archetype] : []
    })
    return [...new Set(values)].sort()
  }, [])

  const filtered = useMemo(() => roster.filter((fighter) => {
    const guide = guideByFighterId.get(fighter.id)
    const haystack = [fighter.name, fighter.series, ...fighter.aliases, guide?.archetype ?? '', guide?.memoryAid ?? ''].join(' ').toLowerCase()
    if (normalized && !haystack.includes(normalized)) return false
    if (series !== 'all' && fighter.series !== series) return false
    if (archetype !== 'all' && (guide?.archetype.split(' · ')[0] ?? guide?.archetype) !== archetype) return false
    if (favoritesOnly && !localState.favorites.includes(fighter.id)) return false
    return true
  }), [archetype, favoritesOnly, localState.favorites, normalized, series])

  const recentFighters = localState.recents.flatMap((id) => {
    const fighter = fighterById.get(id)
    return fighter ? [fighter] : []
  })

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    const index = refs.current.findIndex((element) => element === document.activeElement)
    if (index < 0) return
    event.preventDefault()
    const columns = window.innerWidth < 560 ? 1 : window.innerWidth < 900 ? 2 : window.innerWidth < 1280 ? 3 : 4
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? columns : -columns
    refs.current[Math.max(0, Math.min(filtered.length - 1, index + delta))]?.focus()
  }

  function resetFilters() {
    setQuery('')
    setSeries('all')
    setArchetype('all')
    setFavoritesOnly(false)
  }

  const hasFilters = Boolean(normalized || series !== 'all' || archetype !== 'all' || favoritesOnly)

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">SSBU training companion</p>
          <h1>Pick a fighter. Practice the right thing.</h1>
          <p className="hero-copy">Fast memory aids, source-aware routes, and a 0–200% training ladder for the complete roster. Frame data and move visuals grow into the same pages later.</p>
        </div>
        <div className="hero-stats" aria-label="Guide status">
          <div><strong>{roster.length}</strong><span>fighter guides</span></div>
          <div><strong>{localState.favorites.length}</strong><span>favorites</span></div>
          <div><strong>0</strong><span>servers required</span></div>
        </div>
      </section>

      {recentFighters.length > 0 && (
        <section className="recent-strip" aria-labelledby="recent-title">
          <span className="eyebrow" id="recent-title">Recently viewed</span>
          <div className="recent-links">
            {recentFighters.map((fighter) => <a key={fighter.id} href={hrefFor(`/fighter/${fighter.slug}`)}>{fighter.name}</a>)}
          </div>
        </section>
      )}

      <section className="panel roster-panel" aria-labelledby="roster-title">
        <div className="roster-toolbar">
          <div>
            <p className="eyebrow">Roster</p>
            <h2 id="roster-title">All fighters</h2>
          </div>
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search fighters</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fighter, alias, archetype, or series…" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </label>
        </div>

        <div className="roster-filters" aria-label="Roster filters">
          <label><span>Series</span><select value={series} onChange={(event) => setSeries(event.target.value)}><option value="all">All series</option>{seriesOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Archetype</span><select value={archetype} onChange={(event) => setArchetype(event.target.value)}><option value="all">All archetypes</option>{archetypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="favorite-filter"><input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} /><span>Favorites only</span></label>
          <div className="filter-actions">
            {hasFilters && <button type="button" onClick={resetFilters}>Reset filters</button>}
            {(localState.favorites.length > 0 || localState.recents.length > 0 || Object.keys(localState.practice).length > 0) && <button type="button" onClick={clearLocalData}>Clear local data</button>}
          </div>
        </div>

        <p className="result-count" aria-live="polite">{filtered.length} fighter{filtered.length === 1 ? '' : 's'}</p>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">?</span>
            <h3>No fighter found</h3>
            <p>Try changing the search, series, archetype, or favorites filter.</p>
            <button type="button" className="button-link" onClick={resetFilters}>Reset filters</button>
          </div>
        ) : (
          <div className="roster-grid" onKeyDown={onKey}>
            {filtered.map((fighter, index) => {
              const ready = guideByFighterId.has(fighter.id)
              const favorite = localState.favorites.includes(fighter.id)
              return (
                <a
                  key={fighter.id}
                  className={`fighter-card${ready ? ' fighter-card--ready' : ''}`}
                  href={hrefFor(`/fighter/${fighter.slug}`)}
                  ref={(element) => { refs.current[index] = element }}
                >
                  <div className="fighter-mark" aria-hidden="true">{fighter.name.split(/\s|&/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}</div>
                  <div className="fighter-card__body">
                    <span className="fighter-series">{fighter.series}</span>
                    <strong>{fighter.name}</strong>
                    <span className={`status-pill${favorite ? ' status-pill--favorite' : ' status-pill--ready'}`}>{favorite ? '★ Favorite' : 'Guide ready'}</span>
                  </div>
                  <span className="fighter-arrow" aria-hidden="true">›</span>
                </a>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
