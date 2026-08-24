import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { roster } from '../data/roster'
import { hrefFor } from '../router'
import './RosterView.css'

export function RosterView() {
  const [query, setQuery] = useState('')
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const normalized = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalized) return roster
    return roster.filter((fighter) => [fighter.name, fighter.series, ...fighter.aliases].join(' ').toLowerCase().includes(normalized))
  }, [normalized])

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    const activeIndex = itemRefs.current.findIndex((element) => element === document.activeElement)
    if (activeIndex < 0) return
    event.preventDefault()
    const columns = window.innerWidth < 560 ? 1 : window.innerWidth < 900 ? 2 : window.innerWidth < 1280 ? 3 : 4
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? columns : -columns
    itemRefs.current[Math.max(0, Math.min(filtered.length - 1, activeIndex + delta))]?.focus()
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div><p className="eyebrow">SSBU training companion</p><h1>Pick a fighter. Practice the right thing.</h1><p className="hero-copy">Fast memory aids, source-aware combos, and a 0–200% training ladder. Frame data and move visuals will grow into these same pages later.</p></div>
        <div className="hero-stats" aria-label="Guide status"><div><strong>{roster.length}</strong><span>fighter pages</span></div><div><strong>4</strong><span>reference guides next</span></div><div><strong>0</strong><span>servers required</span></div></div>
      </section>

      <section className="panel roster-panel" aria-labelledby="roster-title">
        <div className="roster-toolbar"><div><p className="eyebrow">Roster</p><h2 id="roster-title">All fighters</h2></div><label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Search fighters</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fighter, alias, or series…" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label></div>
        <p className="result-count" aria-live="polite">{filtered.length} fighter{filtered.length === 1 ? '' : 's'}</p>
        {filtered.length === 0 ? <div className="empty-state"><span className="empty-state__icon" aria-hidden="true">?</span><h3>No fighter found</h3><p>Try a fighter name, nickname, or series.</p></div> : (
          <div className="roster-grid" onKeyDown={onGridKeyDown}>{filtered.map((fighter, index) => (
            <a key={fighter.id} className={`fighter-card${fighter.guideStatus === 'ready' ? ' fighter-card--ready' : ''}`} href={hrefFor(`/fighter/${fighter.slug}`)} ref={(element) => { itemRefs.current[index] = element }}>
              <div className="fighter-mark" aria-hidden="true">{fighter.name.split(/\s|&/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}</div>
              <div className="fighter-card__body"><span className="fighter-series">{fighter.series}</span><strong>{fighter.name}</strong><span className={`status-pill status-pill--${fighter.guideStatus}`}>{fighter.guideStatus === 'ready' ? 'Guide queued' : 'Roster indexed'}</span></div><span className="fighter-arrow" aria-hidden="true">›</span>
            </a>
          ))}</div>
        )}
      </section>
    </div>
  )
}
