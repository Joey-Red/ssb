import { useMemo, useState } from 'react'
import {
  proCharacterLessons,
  proDecisionExercises,
  proDecisionMoments,
  proFighterResearchRegistry,
  proLabReleaseStats,
  proMaintenanceReport,
  proMatchupPatterns,
  proPlayerComparisons,
  proPlayerRepresentatives,
  proRosterCoverage,
  proSetBreakdowns,
  proTemporalEvidence,
  proVodCatalog,
} from '../data/proLab'
import type { ProFrameDataReference, ProPlayerRepresentative } from '../data/proLabTypes'
import { fighterBySlug, roster } from '../data/roster'
import { buildPracticeDrillFromMoment, resolveFrameDataReference } from '../lib/proLabRelease'
import { addCustomDrill } from '../lib/storage'
import { useFrameDataIndex } from '../lib/useFrameData'
import { hrefFor } from '../router'
import { FighterPicture } from './FighterPicture'

const playerById = new Map<string, ProPlayerRepresentative>(proPlayerRepresentatives.map((player) => [player.id, player]))
const fighterById = new Map(roster.map((fighter) => [fighter.id, fighter]))
const temporalByVod = new Map(proTemporalEvidence.map((entry) => [entry.vodId, entry]))
const breakdownByVod = new Map(proSetBreakdowns.map((entry) => [entry.vodId, entry]))
const coverageLabels = {
  'research-queued': 'Research queued',
  'representative-seeded': 'Representative seeded',
  cataloged: 'VOD cataloged',
  'evidence-building': 'Evidence building',
  'teaching-ready': 'Teaching ready',
} as const
const topicLabels = {
  'top-player-priorities': 'Top-player priorities', neutral: 'Neutral', advantage: 'Advantage', disadvantage: 'Disadvantage',
  ledgetrapping: 'Ledgetrapping', recovery: 'Recovery', 'stock-closing': 'Stock closing', adaptations: 'Adaptations', 'beginner-vs-pro': 'Beginner vs. pro',
} as const
const confidenceLabel = (value: number) => `${Math.round(value * 100)}% confidence`

export function ProLabView({ slug }: { slug?: string }) {
  const initial = slug ? fighterBySlug.get(slug) : undefined
  const [fighterId, setFighterId] = useState(initial?.id ?? 'pyra')
  const [coverageSearch, setCoverageSearch] = useState('')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [drillAdded, setDrillAdded] = useState(false)

  const fighter = fighterById.get(fighterId) ?? roster[0]
  if (!fighter) return null
  const coverage = proRosterCoverage.find((entry) => entry.fighterId === fighter.id)
  const research = proFighterResearchRegistry.find((entry) => entry.fighterId === fighter.id)
  const representatives = (research?.representativeIds ?? []).map((id) => playerById.get(id)).filter((player): player is ProPlayerRepresentative => player !== undefined)
  const vods = proVodCatalog.filter((vod) => (vod.playerFighterIds as readonly string[]).includes(fighter.id))
  const lesson = proCharacterLessons.find((entry) => entry.fighterId === fighter.id)
  const exercises = proDecisionExercises.filter((entry) => entry.fighterId === fighter.id)
  const exercise = exercises[exerciseIndex % Math.max(1, exercises.length)]
  const matchupPatterns = proMatchupPatterns.filter((entry) => entry.fighterId === fighter.id)
  const comparison = proPlayerComparisons.find((entry) => entry.fighterId === fighter.id)
  const filteredCoverage = useMemo(() => {
    const query = coverageSearch.trim().toLowerCase()
    if (!query) return proRosterCoverage
    return proRosterCoverage.filter((entry) => {
      const name = fighterById.get(entry.fighterId)?.name.toLowerCase() ?? ''
      return name.includes(query) || entry.fighterId.includes(query) || coverageLabels[entry.state].toLowerCase().includes(query)
    })
  }, [coverageSearch])

  const chooseFighter = (id: string) => {
    const next = fighterById.get(id)
    if (!next) return
    setFighterId(next.id); setExerciseIndex(0); setChoice(null); setRevealed(false); setDrillAdded(false)
    window.location.hash = hrefFor(`/pro-lab/${next.slug}`).slice(1)
  }

  const addDrill = () => {
    if (!exercise) return
    const moment = proDecisionMoments.find((entry) => entry.id === exercise.momentId)
    if (!moment) return
    const seed = buildPracticeDrillFromMoment(moment)
    if (!seed) return
    addCustomDrill({ fighterId: seed.fighterId, title: seed.title, route: seed.route, percent: seed.percent, targetReps: seed.targetReps, notes: seed.notes })
    setDrillAdded(true)
  }

  return <div className="page-stack pro-lab">
    <section className="hero-panel pro-lab__hero"><div><p className="eyebrow">Competitive Decision Lab · checkpoint M90</p><h1>Study the choice, not just the combo.</h1><p className="hero-copy">Reviewed tournament moments become traceable lessons, decisions, frame checks, matchup patterns, player comparisons, and local drills. Unreviewed footage stays queued instead of becoming invented strategy.</p></div><div className="hero-stats"><div><strong>{proLabReleaseStats.fighters}</strong><span>fighters</span></div><div><strong>{proLabReleaseStats.distinctVideos}</strong><span>VODs</span></div><div><strong>{proLabReleaseStats.reviewedMoments}</strong><span>decisions</span></div></div></section>

    <section className="panel pro-lab__picker"><div><p className="eyebrow">Fighter workspace</p><h2>{fighter.name} Pro Lab</h2></div><label><span>Fighter</span><select value={fighter.id} onChange={(event) => chooseFighter(event.target.value)}>{roster.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label></section>

    <section className="pro-lab__fighter-grid">
      <article className="panel pro-lab__identity"><div className="pro-lab__portrait"><FighterPicture fighterId={fighter.id} name={fighter.name} series={fighter.series} /></div><div><p className="eyebrow">Evidence workspace</p><h2>{fighter.name}</h2><p>{fighter.series}</p><div className="pro-lab__status-row"><span className={`pro-lab__status pro-lab__status--${coverage?.state ?? 'research-queued'}`}>{coverageLabels[coverage?.state ?? 'research-queued']}</span><span>{coverage?.representativeCount ?? 0} reps</span><span>{coverage?.vodCount ?? 0} VODs</span><span>{coverage?.reviewedMomentCount ?? 0} reviewed</span></div><div className="pro-lab__actions"><a className="button-link" href={hrefFor(`/fighter/${fighter.slug}`)}>Fighter guide</a><a className="button-link" href={hrefFor(`/fighter/${fighter.slug}/moves`)}>Frame data</a></div></div></article>
      <article className="panel pro-lab__gate"><p className="eyebrow">Evidence gate</p><h2>{lesson?.status === 'ready' ? 'Teaching evidence ready' : 'No invented coaching'}</h2><p>{lesson?.status === 'ready' ? 'Repeated reviewed evidence cleared the lesson threshold.' : 'Set metadata can prove who played and where; it cannot prove why a player chose an option.'}</p><ul>{(coverage?.notes ?? ['Coverage unavailable.']).map((note) => <li key={note}>{note}</li>)}</ul></article>
    </section>

    <section className="panel"><Heading eyebrow="Players" title="Representative study pool" meta={`${representatives.length} provenance-backed`} />{representatives.length ? <div className="pro-lab__card-grid">{representatives.map((player) => <article className="pro-lab__card" key={player.id}><div className="pro-lab__card-top"><h3>{player.tag}</h3><span>{player.status}</span></div><p>{player.country} · {player.region}</p><p>{player.note}</p><div className="pro-lab__link-row">{player.sourceUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>Source {index + 1}</a>)}</div></article>)}</div> : <EvidenceEmpty title="Representative research queued" text="No representative is assigned until the player/character relationship is provenance-backed." />}</section>

    <section className="panel"><Heading eyebrow="Sets" title="Tournament VOD catalog" meta="Explicit external links only" />{vods.length ? <div className="pro-lab__vod-list">{vods.map((vod) => <article className="pro-lab__vod" key={vod.id}><div className="pro-lab__vod-main"><div className="pro-lab__card-top"><h3>{vod.title}</h3><span>{temporalByVod.get(vod.id)?.era ?? 'legacy'}</span></div><p>{vod.date} · {vod.round} · {vod.eventTier}</p><p>{vod.result ?? 'Result not asserted.'}</p><div className="pro-lab__status-row"><span>Quality {vod.quality.score}</span><span>{vod.analysisStatus}</span><span>Version {vod.gameVersion}</span><span>Breakdown {breakdownByVod.get(vod.id)?.status ?? 'queued'}</span></div></div><div className="pro-lab__vod-actions"><a className="button-link" href={vod.videoUrl} target="_blank" rel="noreferrer">Open VOD ↗</a><details><summary>Provenance</summary><div className="pro-lab__source-stack">{vod.sourceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}>{url}</a>)}</div></details></div></article>)}</div> : <EvidenceEmpty title="VOD research queued" text="This fighter has no catalog-quality set yet; the gap remains visible." />}</section>

    <section className="panel"><Heading eyebrow="M81 · Pattern lessons" title="Character lessons" meta={`${lesson?.claims.length ?? 0} evidence-backed`} />{lesson?.claims.length ? <div className="pro-lab__lesson-grid">{lesson.claims.map((claim) => <article className="pro-lab__lesson" key={claim.id}><span>{topicLabels[claim.topic]}</span><h3>{claim.statement}</h3><p>{confidenceLabel(claim.confidence)} · {claim.evidenceVodIds.length} sets · {claim.evidenceMomentIds.length} moments</p><details><summary>Evidence IDs</summary><code>{claim.evidenceMomentIds.join(', ')}</code></details></article>)}</div> : <EvidenceEmpty title="Lesson threshold not met" text="Character lessons require repeated reviewed decisions. Empty is correct until review produces qualifying evidence." />}</section>

    <section className="panel"><Heading eyebrow="M82–M84 · Decision trainer" title="What would you do?" meta={`${exercises.length} exercises`} />{exercise ? <div className="pro-lab__exercise"><div className="pro-lab__exercise-context"><span>Game {exercise.game} · {Math.floor(exercise.timestampSeconds / 60)}:{String(Math.floor(exercise.timestampSeconds % 60)).padStart(2, '0')} · {exercise.context.replace(/-/g, ' ')}</span><h3>{exercise.prompt}</h3><p>The actual pro choice stays hidden until reveal.</p></div><div className="pro-lab__options">{exercise.options.map((option) => <button type="button" className={choice === option ? 'is-selected' : ''} aria-pressed={choice === option} onClick={() => { setChoice(option); setRevealed(false); setDrillAdded(false) }} key={option}>{option}</button>)}</div><button className="pro-lab__reveal" type="button" disabled={!choice} onClick={() => setRevealed(true)}>Reveal reviewed outcome</button>{revealed && choice && <div className="pro-lab__reveal-panel" aria-live="polite"><p className="eyebrow">Observed choice</p><h3>{exercise.actualOption}</h3><p><strong>{choice === exercise.actualOption ? 'You matched the pro choice.' : 'You chose a different plausible option.'}</strong></p><p>{exercise.observableOutcome}</p>{exercise.explanation && <p><strong>Evidence-scored interpretation:</strong> {exercise.explanation}</p>}<p>{exercise.evidenceClass} · {confidenceLabel(exercise.confidence)}</p>{exercise.frameDataReferences.length > 0 && <FrameEvidence references={exercise.frameDataReferences} />}<div className="pro-lab__actions"><button type="button" onClick={addDrill} disabled={drillAdded}>{drillAdded ? 'Added to drills' : 'Create local drill'}</button><a className="button-link" href={hrefFor('/drills')}>Open drills</a><button type="button" onClick={() => { setExerciseIndex((index) => (index + 1) % exercises.length); setChoice(null); setRevealed(false); setDrillAdded(false) }}>Next decision</button></div></div>}</div> : <EvidenceEmpty title="Decision exercises waiting on review" text="Exercises require non-speculative reviewed moments with at least two plausible choices. No synthetic tournament decision is shipped as filler." />}</section>

    <section className="pro-lab__two-column"><article className="panel"><Heading eyebrow="M85 · Matchups" title="Matchup-specific patterns" />{matchupPatterns.length ? matchupPatterns.map((pattern) => <div className="pro-lab__pattern" key={pattern.id}><strong>vs. {fighterById.get(pattern.opponentFighterId)?.name ?? pattern.opponentFighterId}</strong><p>{pattern.statement}</p><span>{pattern.vodCount} sets · {confidenceLabel(pattern.confidence)}</span></div>) : <EvidenceEmpty title="No matchup claim promoted" text="A matchup pattern requires repeated opponent-tagged evidence across multiple sets." />}</article><article className="panel"><Heading eyebrow="M86 · Player comparison" title="Compare elite styles" />{comparison ? <div className="pro-lab__comparison"><p>{comparison.status === 'ready' ? 'Comparison threshold met.' : 'Comparison evidence is building.'}</p>{comparison.playerIds.map((id) => <div className="pro-lab__pattern" key={id}><strong>{playerById.get(id)?.tag ?? id}</strong><p>{comparison.playerSignals[id]?.map((signal) => `${signal.teachingTag} (${signal.context})`).join(' · ') || 'No repeated signal yet.'}</p></div>)}</div> : <EvidenceEmpty title="Second style sample required" text="Comparison is withheld until reviewed evidence exists for at least two representatives." />}</article></section>

    <section className="panel"><Heading eyebrow="M87–M89 · Era, maintenance, full-roster QA" title="89-fighter evidence coverage" meta={`${proLabReleaseStats.catalogedFighters}/${proLabReleaseStats.fighters} cataloged`} /><div className="pro-lab__audit-strip"><span><strong>{proMaintenanceReport.duplicateLearningRecords.length}</strong>duplicates</span><span><strong>{proMaintenanceReport.malformedUrls.length}</strong>bad URLs</span><span><strong>{proMaintenanceReport.staleVodIds.length}</strong>legacy VODs</span><span><strong>{proMaintenanceReport.fightersWithoutCatalogedVods.length}</strong>catalog gaps</span></div><label className="pro-lab__coverage-search"><span>Filter evidence status</span><input value={coverageSearch} onChange={(event) => setCoverageSearch(event.target.value)} placeholder="Search fighter or status" /></label><div className="pro-lab__coverage-grid">{filteredCoverage.map((entry) => { const item = fighterById.get(entry.fighterId); return item ? <a className="pro-lab__coverage-card" href={hrefFor(`/pro-lab/${item.slug}`)} key={entry.fighterId}><strong>{item.name}</strong><span>{coverageLabels[entry.state]}</span><small>{entry.representativeCount} reps · {entry.vodCount} VODs · {entry.reviewedMomentCount} decisions</small></a> : null })}</div><p className="pro-lab__maintenance-note">Dead/private-link checks run in scheduled GitHub maintenance, never as production runtime networking.</p></section>
  </div>
}

function Heading({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{meta && <span className="section-meta">{meta}</span>}</div>
}
function EvidenceEmpty({ title, text }: { title: string; text: string }) {
  return <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>{title}</h3><p>{text}</p></div></div>
}
function FrameEvidence({ references }: { references: readonly ProFrameDataReference[] }) {
  const frameState = useFrameDataIndex()
  if (frameState.loading) return <div className="pro-lab__frame-evidence" role="status">Loading frame data…</div>
  if (!frameState.data) return <div className="pro-lab__frame-evidence">Frame data unavailable.</div>
  const resolved = references.map((reference) => resolveFrameDataReference(frameState.data?.byFighterId.get(reference.fighterId), reference)).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  if (!resolved.length) return <div className="pro-lab__frame-evidence">No committed move row resolved, so no numeric claim is shown.</div>
  return <div className="pro-lab__frame-evidence"><p className="eyebrow">M83 · Existing frame data</p>{resolved.map((reference) => <article key={`${reference.fighterId}-${reference.moveId}`}><h4>{reference.moveName}</h4><div className="pro-lab__metric-row">{reference.metrics.map((metric) => <span key={metric.key}><strong>{metric.label}</strong>{metric.value ?? 'Unknown'}</span>)}</div><a href={reference.sourceUrl} target="_blank" rel="noreferrer">Open frame-data source ↗</a></article>)}</div>
}
