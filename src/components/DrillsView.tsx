import { useMemo, useState, type FormEvent } from 'react'
import { fighterById, roster } from '../data/roster'
import {
  addCustomDrill,
  clearCompletedDrills,
  incrementCustomDrill,
  removeCustomDrill,
  resetCustomDrill,
  useLocalState,
} from '../lib/storage'
import { hrefFor } from '../router'
import './DrillsView.css'

function splitRoute(value: string): string[] {
  return value
    .split(/(?:\s*>\s*|\s*→\s*|\s*,\s*)/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function DrillsView() {
  const { drills } = useLocalState()
  const [fighterId, setFighterId] = useState<string>(roster[0]?.id ?? 'mario')
  const [title, setTitle] = useState('')
  const [routeText, setRouteText] = useState('')
  const [percentText, setPercentText] = useState('')
  const [targetReps, setTargetReps] = useState(10)
  const [notes, setNotes] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)

  const visibleDrills = useMemo(
    () => drills.filter((drill) => showCompleted || drill.completedReps < drill.targetReps),
    [drills, showCompleted],
  )
  const completedCount = drills.filter((drill) => drill.completedReps >= drill.targetReps).length
  const totalReps = drills.reduce((sum, drill) => sum + drill.completedReps, 0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const route = splitRoute(routeText)
    if (!title.trim() || route.length === 0) return
    const parsedPercent = percentText.trim() === '' ? null : Number(percentText)
    addCustomDrill({
      fighterId,
      title,
      route,
      percent: Number.isFinite(parsedPercent) ? parsedPercent : null,
      targetReps,
      notes,
    })
    setTitle('')
    setRouteText('')
    setPercentText('')
    setTargetReps(10)
    setNotes('')
  }

  return (
    <div className="page-stack drills-view">
      <section className="hero-panel drills-hero">
        <div>
          <p className="eyebrow">Custom training</p>
          <h1>Build your rep queue.</h1>
          <p className="hero-copy">Save the exact routes you want to grind, set a target rep count, and track them without an account. Everything stays in this browser.</p>
        </div>
        <div className="hero-stats" aria-label="Drill queue summary">
          <div><strong>{drills.length}</strong><span>drills</span></div>
          <div><strong>{totalReps}</strong><span>reps logged</span></div>
          <div><strong>{completedCount}</strong><span>complete</span></div>
        </div>
      </section>

      <div className="drills-layout">
        <section className="panel drill-builder" aria-labelledby="drill-builder-title">
          <div className="section-heading"><div><p className="eyebrow">New drill</p><h2 id="drill-builder-title">Add to queue</h2></div></div>
          <form onSubmit={submit}>
            <label><span>Fighter</span><select value={fighterId} onChange={(event) => setFighterId(event.target.value)}>{roster.map((fighter) => <option value={fighter.id} key={fighter.id}>{fighter.name}</option>)}</select></label>
            <label><span>Drill name</span><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Dtilt starter conversion" /></label>
            <label className="drill-builder__wide"><span>Route / actions</span><input required value={routeText} onChange={(event) => setRouteText(event.target.value)} placeholder="Dtilt > Utilt > Uair > fast fall" /><small>Separate actions with &gt;, →, or commas.</small></label>
            <label><span>Starting percent</span><input inputMode="numeric" type="number" min="0" max="999" value={percentText} onChange={(event) => setPercentText(event.target.value)} placeholder="Any" /></label>
            <label><span>Target reps</span><input type="number" min="1" max="999" value={targetReps} onChange={(event) => setTargetReps(Math.max(1, Number(event.target.value) || 1))} /></label>
            <label className="drill-builder__wide"><span>Notes</span><textarea maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="DI, delay, fast-fall timing, dummy setup…" /></label>
            <button className="button-link drill-builder__submit" type="submit">Add drill</button>
          </form>
          <p className="drill-local-note"><span className="health-dot" aria-hidden="true" /> Local only · no login · no sync · no telemetry</p>
        </section>

        <section className="panel drill-queue" aria-labelledby="drill-queue-title">
          <div className="section-heading drill-queue__heading">
            <div><p className="eyebrow">Queue</p><h2 id="drill-queue-title">Today’s reps</h2></div>
            <div className="drill-queue__actions">
              <label><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} /> Show completed</label>
              {completedCount > 0 && <button type="button" onClick={clearCompletedDrills}>Clear completed</button>}
            </div>
          </div>

          {visibleDrills.length > 0 ? <div className="drill-list">{visibleDrills.map((drill) => {
            const fighter = fighterById.get(drill.fighterId)
            const complete = drill.completedReps >= drill.targetReps
            const progress = Math.min(100, Math.round((drill.completedReps / drill.targetReps) * 100))
            return <article className={`drill-card${complete ? ' is-complete' : ''}`} key={drill.id}>
              <header><div><span>{fighter?.name ?? drill.fighterId}{drill.percent !== null ? ` · ${drill.percent}%` : ''}</span><h3>{drill.title}</h3></div><b>{drill.completedReps}/{drill.targetReps}</b></header>
              <div className="drill-route" aria-label="Drill route">{drill.route.map((step, index) => <span key={`${step}-${index}`}><strong>{step}</strong>{index < drill.route.length - 1 && <i aria-hidden="true">→</i>}</span>)}</div>
              {drill.notes && <p>{drill.notes}</p>}
              <div className="drill-progress" role="progressbar" aria-valuemin={0} aria-valuemax={drill.targetReps} aria-valuenow={drill.completedReps} aria-label={`${drill.title} repetitions`}><span style={{ width: `${progress}%` }} /></div>
              <footer>
                <div className="drill-card__links">{fighter && <><a href={hrefFor(`/practice/${fighter.slug}`)}>Practice page</a><a href={hrefFor(`/fighter/${fighter.slug}`)}>Guide</a></>}</div>
                <div className="drill-card__buttons"><button type="button" onClick={() => resetCustomDrill(drill.id)} disabled={drill.completedReps === 0}>Reset</button><button type="button" className="drill-delete" onClick={() => removeCustomDrill(drill.id)} aria-label={`Delete ${drill.title}`}>Delete</button><button type="button" className="drill-rep" onClick={() => incrementCustomDrill(drill.id)} disabled={complete}>{complete ? 'Complete' : '+1 rep'}</button></div>
              </footer>
            </article>
          })}</div> : <div className="empty-state"><span className="empty-state__icon" aria-hidden="true">+</span><h3>{drills.length === 0 ? 'No custom drills yet' : 'No active drills'}</h3><p>{drills.length === 0 ? 'Use the builder to add the exact route you want to practice.' : 'Turn on “Show completed” or add another drill.'}</p></div>}
        </section>
      </div>
    </div>
  )
}
