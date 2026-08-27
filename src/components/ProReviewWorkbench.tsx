import { useEffect, useMemo, useState } from 'react'
import { proVodCatalog } from '../data/proLab'
import type { ProDecisionMoment } from '../data/proLabTypes'
import { fighterById, roster } from '../data/roster'
import { validateProReviewSubmission } from '../lib/proLabReviewIntake'
import {
  buildProReviewSubmissionFromDraft,
  createBlankProReviewMoment,
  createProReviewWorkbenchDraft,
  parseProReviewWorkbenchDraft,
  reviewContexts,
  reviewEvidenceClasses,
  reviewPlaybackSeconds,
  serializeProReviewSubmission,
  serializeProReviewWorkbenchDraft,
  type ProReviewWorkbenchDraft,
} from '../lib/proLabReviewWorkbench'
import { hrefFor } from '../router'
import './ProReviewWorkbench.css'

const fighterIds = roster.map((fighter) => fighter.id)
const storageKey = (vodId: string) => `smash-forge.pro-review.${vodId}`
const splitComma = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
const splitLines = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}

const withTime = (url: string, seconds: number) =>
  `${url}${url.includes('?') ? '&' : '?'}t=${Math.max(0, Math.floor(seconds))}s`

function loadStoredDraft(vodId: string): ProReviewWorkbenchDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(storageKey(vodId))
  if (!raw) return null
  return parseProReviewWorkbenchDraft(raw, vodId).draft
}

export function ProReviewWorkbench({ vodId }: { vodId: string }) {
  const vod = useMemo(() => proVodCatalog.find((entry) => entry.id === vodId), [vodId])
  const [draft, setDraft] = useState<ProReviewWorkbenchDraft | null>(() => vod ? loadStoredDraft(vod.id) ?? createProReviewWorkbenchDraft(vod) : null)
  const [importText, setImportText] = useState('')
  const [importErrors, setImportErrors] = useState<readonly string[]>([])
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!vod) { setDraft(null); return }
    setDraft(loadStoredDraft(vod.id) ?? createProReviewWorkbenchDraft(vod))
    setImportText('')
    setImportErrors([])
    setStatusMessage('')
  }, [vod])

  useEffect(() => {
    if (!draft || typeof window === 'undefined') return
    window.localStorage.setItem(storageKey(draft.vodId), serializeProReviewWorkbenchDraft(draft))
  }, [draft])

  if (!vod || !draft) {
    return <section className="panel pro-review__missing"><p className="eyebrow">Pro Lab review</p><h1>VOD not found</h1><p>This review route does not match a cataloged Pro Lab set.</p><a className="button-link" href={hrefFor('/pro-lab')}>Back to Pro Lab</a></section>
  }

  const submission = buildProReviewSubmissionFromDraft(draft)
  const report = validateProReviewSubmission(submission, proVodCatalog, fighterIds)
  const primaryFighters = vod.playerFighterIds
  const opponentFighters = vod.opponentFighterIds
  const primaryWorkspace = primaryFighters[0] ? fighterById.get(primaryFighters[0]) : undefined
  const basePlaybackSeconds = vod.startSeconds ?? 0

  const updateMoment = (index: number, patch: Partial<ProDecisionMoment>) => {
    setDraft((current) => {
      if (!current) return current
      const moments = current.moments.map((moment, momentIndex) => momentIndex === index ? { ...moment, ...patch } : moment)
      return { ...current, moments }
    })
  }

  const addMoment = () => {
    setDraft((current) => current ? { ...current, moments: [...current.moments, createBlankProReviewMoment(vod, current.moments.length)] } : current)
  }

  const removeMoment = (index: number) => {
    setDraft((current) => current ? { ...current, moments: current.moments.filter((_, momentIndex) => momentIndex !== index) } : current)
  }

  const resetDraft = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey(vod.id))
    setDraft(createProReviewWorkbenchDraft(vod))
    setImportErrors([])
    setStatusMessage('Draft reset.')
  }

  const importDraft = () => {
    const parsed = parseProReviewWorkbenchDraft(importText, vod.id)
    if (!parsed.draft) { setImportErrors(parsed.errors); return }
    setDraft(parsed.draft)
    setImportErrors([])
    setStatusMessage('Draft imported and saved locally.')
  }

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatusMessage(message)
    } catch {
      setStatusMessage('Clipboard access failed. Use the export box instead.')
    }
  }

  const downloadSubmission = () => {
    if (!report.valid) return
    const blob = new Blob([serializeProReviewSubmission(submission)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${vod.id}-review-submission.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage('Validated submission downloaded.')
  }

  return <div className="page-stack pro-review">
    <section className="hero-panel pro-review__hero">
      <div><p className="eyebrow">Evidence workbench</p><h1>Review the footage, then earn the claim.</h1><p className="hero-copy">This browser-local workspace never promotes VOD metadata into strategy. Record only what you directly observe, then the same production validators decide whether the submission is eligible.</p></div>
      <div className="hero-stats"><div><strong>{draft.moments.length}</strong><span>draft moments</span></div><div><strong>{report.errors.length}</strong><span>blocking errors</span></div><div><strong>{report.warnings.length}</strong><span>warnings</span></div></div>
    </section>

    <section className="panel pro-review__source">
      <div className="section-heading"><div><p className="eyebrow">Review target</p><h2>{vod.title}</h2></div><span className="section-meta">{vod.event} · {vod.date}</span></div>
      <p><strong>{primaryFighters.map((id) => fighterById.get(id)?.name ?? id).join(' / ') || 'Unverified character'}</strong> vs. <strong>{vod.opponentTag}</strong>{opponentFighters.length ? ` · ${opponentFighters.map((id) => fighterById.get(id)?.name ?? id).join(' / ')}` : ''}</p>
      <p>{vod.round} · {vod.eventTier} · quality {vod.quality.score} · {vod.analysisStatus}</p>
      <div className="pro-review__actions"><a className="button-link" href={withTime(vod.videoUrl, basePlaybackSeconds)} target="_blank" rel="noreferrer">Open source footage ↗</a>{primaryWorkspace && <a className="button-link" href={hrefFor(`/pro-lab/${primaryWorkspace.slug}`)}>Back to fighter workspace</a>}<a className="button-link" href={hrefFor('/pro-lab')}>Pro Lab overview</a></div>
      <p className="pro-review__notice">Exact round/result/character/timing claims remain limited to the catalog metadata above. Tactical fields below must come from direct gameplay review.</p>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Submission state</p><h2>Strict evidence gate</h2></div><span className={`pro-review__gate ${report.valid ? 'is-valid' : ''}`}>{report.valid ? 'VALID' : 'BLOCKED'}</span></div>
      <div className="pro-review__status-grid"><label><span>Target status</span><select value={draft.targetStatus} onChange={(event) => setDraft({ ...draft, targetStatus: event.target.value as ProReviewWorkbenchDraft['targetStatus'] })}><option value="annotated">Annotated</option><option value="reviewed">Reviewed</option></select></label><div><strong>{report.eligibleMomentCount}</strong><span>teaching-eligible moments</span></div><div><strong>{report.errors.length}</strong><span>errors</span></div><div><strong>{report.warnings.length}</strong><span>warnings</span></div></div>
      {report.issues.length > 0 ? <div className="pro-review__issues">{report.issues.map((issue, index) => <article className={`pro-review__issue pro-review__issue--${issue.severity}`} key={`${issue.code}-${issue.recordId}-${index}`}><strong>{issue.code}</strong><span>{issue.recordId}</span><p>{issue.message}</p></article>)}</div> : <p className="pro-review__success">All strict production evidence checks pass.</p>}
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Direct observations</p><h2>Timestamped decision moments</h2></div><button type="button" className="button-link" onClick={addMoment}>+ Add observed moment</button></div>
      {draft.moments.length === 0 ? <div className="pro-lab__empty"><span aria-hidden="true">◇</span><div><h3>No gameplay observation recorded</h3><p>That is the correct state until the source footage has actually been reviewed.</p></div></div> : <div className="pro-review__moments">{draft.moments.map((moment, index) => {
        const playbackSeconds = reviewPlaybackSeconds(vod, moment.timestampSeconds)
        return <article className="pro-review__moment" key={`${moment.id}-${index}`}>
          <div className="pro-review__moment-head"><div><span className="eyebrow">Moment {index + 1}</span><h3>{moment.id}</h3></div><div className="pro-review__actions"><a href={withTime(vod.videoUrl, playbackSeconds)} target="_blank" rel="noreferrer">Open {formatTime(playbackSeconds)} ↗</a><button type="button" onClick={() => removeMoment(index)}>Remove</button></div></div>
          <div className="pro-review__form-grid">
            <label><span>ID</span><input value={moment.id} onChange={(event) => updateMoment(index, { id: event.target.value })} /></label>
            <label><span>Game</span><input type="number" min="1" step="1" value={moment.game} onChange={(event) => updateMoment(index, { game: Number(event.target.value) })} /></label>
            <label><span>Timestamp seconds</span><input type="number" min="0" step="1" value={moment.timestampSeconds} onChange={(event) => updateMoment(index, { timestampSeconds: Number(event.target.value) })} /></label>
            <label><span>Context</span><select value={moment.context} onChange={(event) => updateMoment(index, { context: event.target.value as ProDecisionMoment['context'] })}>{reviewContexts.map((value) => <option value={value} key={value}>{value.replace(/-/g, ' ')}</option>)}</select></label>
            <label><span>Reviewed fighter</span><select value={moment.fighterId} onChange={(event) => updateMoment(index, { fighterId: event.target.value })}>{primaryFighters.map((id) => <option value={id} key={id}>{fighterById.get(id)?.name ?? id}</option>)}</select></label>
            <label><span>Opponent fighter</span><select value={moment.opponentFighterId ?? ''} onChange={(event) => updateMoment(index, { opponentFighterId: event.target.value || undefined })}><option value="">Unknown / not asserted</option>{opponentFighters.map((id) => <option value={id} key={id}>{fighterById.get(id)?.name ?? id}</option>)}</select></label>
            <label><span>Evidence class</span><select value={moment.evidenceClass} onChange={(event) => updateMoment(index, { evidenceClass: event.target.value as ProDecisionMoment['evidenceClass'] })}>{reviewEvidenceClasses.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label><span>Confidence (0–1)</span><input type="number" min="0" max="1" step="0.05" value={moment.confidence} onChange={(event) => updateMoment(index, { confidence: Number(event.target.value) })} /></label>
            <label><span>Player stocks</span><input type="number" min="0" max="3" step="1" value={moment.state.playerStocks ?? ''} onChange={(event) => updateMoment(index, { state: { ...moment.state, playerStocks: event.target.value === '' ? undefined : Number(event.target.value) } })} /></label>
            <label><span>Opponent stocks</span><input type="number" min="0" max="3" step="1" value={moment.state.opponentStocks ?? ''} onChange={(event) => updateMoment(index, { state: { ...moment.state, opponentStocks: event.target.value === '' ? undefined : Number(event.target.value) } })} /></label>
            <label><span>Player %</span><input type="number" min="0" step="0.1" value={moment.state.playerPercent ?? ''} onChange={(event) => updateMoment(index, { state: { ...moment.state, playerPercent: event.target.value === '' ? undefined : Number(event.target.value) } })} /></label>
            <label><span>Opponent %</span><input type="number" min="0" step="0.1" value={moment.state.opponentPercent ?? ''} onChange={(event) => updateMoment(index, { state: { ...moment.state, opponentPercent: event.target.value === '' ? undefined : Number(event.target.value) } })} /></label>
            <label><span>Stage</span><input value={moment.state.stage ?? ''} onChange={(event) => updateMoment(index, { state: { ...moment.state, stage: event.target.value || undefined } })} /></label>
            <label><span>Position</span><select value={moment.state.position ?? 'unknown'} onChange={(event) => updateMoment(index, { state: { ...moment.state, position: event.target.value as NonNullable<ProDecisionMoment['state']['position']> } })}><option value="unknown">unknown</option><option value="center">center</option><option value="corner">corner</option><option value="ledge">ledge</option><option value="offstage">offstage</option><option value="platform">platform</option></select></label>
            <label className="pro-review__wide"><span>Chosen option — observable action</span><textarea value={moment.chosenOption} onChange={(event) => updateMoment(index, { chosenOption: event.target.value })} placeholder="Describe the action actually chosen, without inventing intent." /></label>
            <label className="pro-review__wide"><span>Observable outcome</span><textarea value={moment.observableOutcome} onChange={(event) => updateMoment(index, { observableOutcome: event.target.value })} placeholder="What visibly happened after the choice?" /></label>
            <label className="pro-review__wide"><span>Interpretation — optional and qualified</span><textarea value={moment.interpretation ?? ''} onChange={(event) => updateMoment(index, { interpretation: event.target.value || undefined })} placeholder="Leave empty when the footage does not support an interpretation." /></label>
            <label><span>Teaching tags, comma-separated</span><input value={moment.teachingTags.join(', ')} onChange={(event) => updateMoment(index, { teachingTags: splitComma(event.target.value) })} /></label>
            <label><span>Plausible alternatives, one per line</span><textarea value={(moment.plausibleAlternatives ?? []).join('\n')} onChange={(event) => updateMoment(index, { plausibleAlternatives: splitLines(event.target.value) })} /></label>
            <label className="pro-review__wide"><span>Reviewer note</span><textarea value={moment.reviewerNote ?? ''} onChange={(event) => updateMoment(index, { reviewerNote: event.target.value || undefined })} placeholder="Record uncertainty, visibility limitations, or why a field was omitted." /></label>
          </div>
        </article>
      })}</div>}
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Set-level synthesis</p><h2>Evidence-backed breakdown</h2></div><span className="section-meta">Derived only from the moments above</span></div>
      <div className="pro-review__form-grid">
        <label className="pro-review__wide"><span>Set thesis</span><textarea value={draft.thesis} onChange={(event) => setDraft({ ...draft, thesis: event.target.value })} placeholder="Optional. Summarize only patterns supported by reviewed moments." /></label>
        <label><span>Recurring habits — one per line</span><textarea value={draft.recurringHabits} onChange={(event) => setDraft({ ...draft, recurringHabits: event.target.value })} /></label>
        <label><span>Adaptation notes — one per line</span><textarea value={draft.adaptationNotes} onChange={(event) => setDraft({ ...draft, adaptationNotes: event.target.value })} /></label>
        <label className="pro-review__wide"><span>Reviewer notes — one per line</span><textarea value={draft.reviewerNotes} onChange={(event) => setDraft({ ...draft, reviewerNotes: event.target.value })} /></label>
      </div>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Local persistence + handoff</p><h2>Export reviewed evidence</h2></div><span className="section-meta">Draft auto-saves in this browser only</span></div>
      <div className="pro-review__actions"><button type="button" onClick={() => void copyText(serializeProReviewWorkbenchDraft(draft), 'Draft JSON copied.')}>Copy draft JSON</button><button type="button" disabled={!report.valid} onClick={() => void copyText(serializeProReviewSubmission(submission), 'Validated submission copied.')}>Copy validated submission</button><button type="button" disabled={!report.valid} onClick={downloadSubmission}>Download validated submission</button><button type="button" onClick={resetDraft}>Reset local draft</button></div>
      {statusMessage && <p className="pro-review__status-message" role="status">{statusMessage}</p>}
      <details className="pro-review__import"><summary>Import a saved draft</summary><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a Pro Lab review workbench draft JSON object." />{importErrors.length > 0 && <ul>{importErrors.map((error) => <li key={error}>{error}</li>)}</ul>}<button type="button" onClick={importDraft}>Import this VOD draft</button></details>
      <details className="pro-review__export"><summary>Current submission JSON</summary><textarea readOnly value={serializeProReviewSubmission(submission)} /></details>
    </section>
  </div>
}
