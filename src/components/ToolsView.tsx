import { useMemo, useState } from 'react'
import { frameDataByFighterId, frameMoveCount } from '../data/frameData'
import { roster } from '../data/roster'
import { fastestOosOptions } from '../lib/frameData'
import type { FighterFrameData } from '../types'
import { FrameTimeline } from './FrameTimeline'
import './ToolsView.css'

function firstMove(data: FighterFrameData | undefined) {
  return data?.moves.find((move) => move.startupFrame !== null) ?? data?.moves[0]
}

function metric(label: string, left: string | number | null, right: string | number | null) {
  return <div className="compare-metric" key={label}><span>{label}</span><strong>{left ?? '—'}</strong><strong>{right ?? '—'}</strong></div>
}

function MoveSelect({ data, moveId, onChange }: { data: FighterFrameData; moveId: string; onChange: (id: string) => void }) {
  return <select value={moveId} onChange={(event) => onChange(event.target.value)}>{data.moves.map((move) => <option key={move.id} value={move.id}>{move.name}</option>)}</select>
}

export function ToolsView() {
  const initialLeft: string = roster[0]?.id ?? 'mario'
  const initialRight: string = roster[1]?.id ?? 'donkey-kong'
  const [leftId, setLeftId] = useState(initialLeft)
  const [rightId, setRightId] = useState(initialRight)
  const leftData = frameDataByFighterId.get(leftId)
  const rightData = frameDataByFighterId.get(rightId)
  const [leftMoveId, setLeftMoveId] = useState(() => firstMove(leftData)?.id ?? '')
  const [rightMoveId, setRightMoveId] = useState(() => firstMove(rightData)?.id ?? '')
  const [search, setSearch] = useState('')
  const [maxStartup, setMaxStartup] = useState(6)

  const leftMove = leftData?.moves.find((move) => move.id === leftMoveId) ?? firstMove(leftData)
  const rightMove = rightData?.moves.find((move) => move.id === rightMoveId) ?? firstMove(rightData)

  function changeFighter(side: 'left' | 'right', fighterId: string) {
    const data = frameDataByFighterId.get(fighterId)
    const nextMove = firstMove(data)?.id ?? ''
    if (side === 'left') { setLeftId(fighterId); setLeftMoveId(nextMove) }
    else { setRightId(fighterId); setRightMoveId(nextMove) }
  }

  const discovered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return [...frameDataByFighterId.values()].flatMap((fighter) => fighter.moves.flatMap((move) => {
      if (move.startupFrame === null || move.startupFrame > maxStartup) return []
      if (normalized && !`${fighter.name} ${move.name} ${move.category}`.toLowerCase().includes(normalized)) return []
      return [{ fighter, move }]
    })).sort((a, b) => (a.move.startupFrame ?? 999) - (b.move.startupFrame ?? 999) || a.fighter.name.localeCompare(b.fighter.name)).slice(0, 80)
  }, [maxStartup, search])

  return <div className="page-stack tools-view">
    <section className="hero-panel tools-hero"><div><p className="eyebrow">Frame-data workspace</p><h1>Compare. Discover. Verify.</h1><p className="hero-copy">Cross-roster move comparison and out-of-shield startup references over {frameMoveCount.toLocaleString()} committed move rows. Raw source notation stays visible.</p></div><div className="hero-stats"><div><strong>{frameDataByFighterId.size}</strong><span>fighters</span></div><div><strong>{frameMoveCount}</strong><span>move rows</span></div></div></section>

    <section className="panel" aria-labelledby="compare-title">
      <div className="section-heading"><div><p className="eyebrow">Move comparison</p><h2 id="compare-title">Side-by-side frame reference</h2></div></div>
      {leftData && rightData && leftMove && rightMove && <>
        <div className="compare-pickers">
          <label><span>Fighter A</span><select value={leftId} onChange={(event) => changeFighter('left', event.target.value)}>{roster.map((fighter) => <option key={fighter.id} value={fighter.id}>{fighter.name}</option>)}</select><MoveSelect data={leftData} moveId={leftMove.id} onChange={setLeftMoveId}/></label>
          <label><span>Fighter B</span><select value={rightId} onChange={(event) => changeFighter('right', event.target.value)}>{roster.map((fighter) => <option key={fighter.id} value={fighter.id}>{fighter.name}</option>)}</select><MoveSelect data={rightData} moveId={rightMove.id} onChange={setRightMoveId}/></label>
        </div>
        <div className="compare-grid"><div className="compare-metric compare-metric--header"><span>Metric</span><strong>{leftData.name} · {leftMove.name}</strong><strong>{rightData.name} · {rightMove.name}</strong></div>{[
          metric('Startup', leftMove.startup, rightMove.startup), metric('Active', leftMove.active, rightMove.active), metric('Total frames', leftMove.totalFrames, rightMove.totalFrames), metric('FAF', leftMove.faf, rightMove.faf), metric('Landing lag', leftMove.landingLag, rightMove.landingLag), metric('Autocancel', leftMove.autocancel, rightMove.autocancel), metric('On shield', leftMove.onShield, rightMove.onShield), metric('Damage', leftMove.damage, rightMove.damage),
        ]}</div>
        <div className="compare-timelines"><FrameTimeline move={leftMove}/><FrameTimeline move={rightMove}/></div>
      </>}
    </section>

    <section className="panel" aria-labelledby="oos-title"><div className="section-heading"><div><p className="eyebrow">OOS explorer</p><h2 id="oos-title">Fastest startup references</h2></div></div><div className="oos-compare">{[leftData, rightData].flatMap((data) => data ? [data] : []).map((data) => <article key={data.fighterId}><h3>{data.name}</h3>{fastestOosOptions(data.moves, 8).map(({ move, timing }) => <div key={move.id}><span>{move.name}</span><strong>{timing.startup}f</strong><small>{timing.method === 'jumpsquat' ? '3f jumpsquat + move startup' : 'direct OOS'}</small></div>)}</article>)}</div><p className="tool-warning">These are earliest startup references, not automatic punish guarantees. Shieldstun, shield advantage, spacing, pushback, range and invulnerability can change whether an option connects.</p></section>

    <section className="panel" aria-labelledby="discover-title"><div className="section-heading"><div><p className="eyebrow">Move discovery</p><h2 id="discover-title">Find fast buttons across the roster</h2></div></div><div className="discovery-controls"><label><span>Search</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="fighter, move, category…"/></label><label><span>Maximum startup: {maxStartup}f</span><input type="range" min="1" max="30" value={maxStartup} onChange={(event) => setMaxStartup(Number(event.target.value))}/></label></div><div className="discovery-list">{discovered.map(({ fighter, move }) => <a href={`#/fighter/${roster.find((entry) => entry.id === fighter.fighterId)?.slug ?? fighter.fighterId}`} key={`${fighter.fighterId}-${move.id}`}><span><strong>{fighter.name}</strong><small>{move.name} · {move.category}</small></span><b>{move.startup}</b></a>)}</div>{discovered.length === 0 && <div className="empty-state"><h3>No move matches</h3><p>Raise the startup cap or change the search.</p></div>}</section>
  </div>
}
