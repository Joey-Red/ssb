import { useMemo, useState } from 'react'
import type { FighterFrameData, MoveCategory } from '../types'
import { fastestOosOptions } from '../lib/frameData'
import { FrameTimeline } from './FrameTimeline'
import { MoveFrameViewer } from './MoveFrameViewer'
import './FrameDataPanel.css'

const categories: readonly (MoveCategory | 'all')[] = ['all', 'ground', 'aerial', 'special', 'grab', 'defense', 'misc']

function value(value: string | null) {
  return value ?? '—'
}

export function FrameDataPanel({ data }: { data: FighterFrameData }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MoveCategory | 'all'>('all')
  const normalized = query.trim().toLowerCase()

  const moves = useMemo(() => data.moves
    .filter((move) => category === 'all' || move.category === category)
    .filter((move) => !normalized || [move.name, move.hitboxType ?? '', move.autocancel ?? ''].join(' ').toLowerCase().includes(normalized))
    .sort((a, b) => (a.startupFrame ?? Number.MAX_SAFE_INTEGER) - (b.startupFrame ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name)),
  [category, data.moves, normalized])

  const oos = useMemo(() => fastestOosOptions(data.moves), [data.moves])
  const stats = [
    ['Weight', data.stats.weight], ['Run', data.stats.runSpeed], ['Initial dash', data.stats.initialDash],
    ['Air speed', data.stats.airSpeed], ['Fall', data.stats.fallSpeed], ['Fast fall', data.stats.fastFallSpeed],
  ] as const
  const hasStats = stats.some(([, stat]) => stat !== null)

  return (
    <section className="panel frame-data-panel" aria-labelledby="frame-data-title">
      <div className="section-heading frame-data-heading"><div><p className="eyebrow">Full frame data</p><h2 id="frame-data-title">Move reference</h2></div><a className="frame-source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">Ultimate Frame Data ↗</a></div>
      {hasStats
        ? <div className="frame-stats" aria-label={`${data.name} movement statistics`}>{stats.map(([label, stat]) => <span key={label}><small>{label}</small><strong>{value(stat)}</strong></span>)}</div>
        : <p className="frame-data-footnote">Movement-stat fields are intentionally left blank until an equally reliable structured source is wired into the snapshot. Move timing data below is available.</p>}
      {oos.length > 0 && <div className="oos-strip" aria-label="Fast out of shield startup references"><div><span className="eyebrow">OOS reference</span><p>Startup only; spacing, shieldstun and reach still decide whether a punish connects.</p></div><div className="oos-options">{oos.map(({ move, timing }) => <span key={move.id}><strong>{move.name}</strong><b>{timing.startup}f</b></span>)}</div></div>}
      <div className="frame-toolbar"><label className="frame-search"><span className="sr-only">Search moves</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search move, hitbox, autocancel…" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear move search">×</button>}</label><div className="frame-category-tabs" aria-label="Move category filter">{categories.map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="frame-grid frame-grid--header" aria-hidden="true"><span>Move</span><span>Startup</span><span>Active</span><span>Total</span><span>Landing</span><span>On shield</span><span>Damage</span></div>
      <div className="frame-records">{moves.map((move) => <details className="frame-record" key={move.id}><summary className="frame-grid"><span className="frame-move-name"><strong>{move.name}</strong><small>{move.category}</small></span><span data-label="Startup">{value(move.startup)}</span><span data-label="Active">{value(move.active)}</span><span data-label="Total">{value(move.totalFrames)}</span><span data-label="Landing">{value(move.landingLag)}</span><span data-label="On shield">{value(move.onShield)}</span><span data-label="Damage">{value(move.damage)}</span></summary><div className="frame-record__details"><FrameTimeline move={move}/><MoveFrameViewer fighterName={data.name} move={move}/><div className="frame-extra-grid"><span><small>FAF</small><strong>{value(move.faf)}</strong></span><span><small>Autocancel</small><strong>{value(move.autocancel)}</strong></span><span><small>Shield lag</small><strong>{value(move.shieldLag)}</strong></span><span><small>Shield stun</small><strong>{value(move.shieldStun)}</strong></span><span><small>End lag</small><strong>{value(move.endLag)}</strong></span><span><small>Hitbox</small><strong>{value(move.hitboxType)}</strong></span></div></div></details>)}</div>
      {moves.length === 0 && <div className="empty-state"><span className="empty-state__icon" aria-hidden="true">?</span><h3>No moves match</h3><p>Change the category or move search.</p></div>}
      <p className="frame-data-footnote">Raw factual notation is preserved for ranges, multi-hits and early/late values. Total frames and FAF are separate fields; this app never substitutes one for the other. The scrubber visualizes timing phases only and does not invent hitbox geometry.</p>
    </section>
  )
}
