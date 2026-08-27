import {
  proAegisPilotProgress,
  proAegisPilotReviewBatch,
  proAegisPilotSubmissionTemplates,
  proAegisPilotWorksheets,
  proCoverageSummary,
  proCoverageWorkQueue,
  proDecisionMomentValidation,
  proLabReleaseStats,
  proSetBreakdownValidation,
} from '../data/proLab'
import { roster } from '../data/roster'
import { hrefFor } from '../router'
import type { FighterManifestEntry } from '../types'

const fighterById = new Map<string, FighterManifestEntry>(roster.map((fighter) => [fighter.id, fighter]))
const worksheetByVod = new Map(proAegisPilotWorksheets.map((worksheet) => [worksheet.vodId, worksheet]))
const submissionTemplateByVod = new Map(proAegisPilotSubmissionTemplates.map((submission) => [submission.vodId, submission]))
const formatFighters = (fighterIds: readonly string[]) => fighterIds.map((id) => fighterById.get(id)?.name ?? id).join(' / ')
const actionLabel = (value: string) => value.replace(/-/g, ' ')

export function ProLabOperations() {
  const validationErrors = proDecisionMomentValidation.errors.length + proSetBreakdownValidation.errors.length
  const validationWarnings = proDecisionMomentValidation.warnings.length + proSetBreakdownValidation.warnings.length
  const samplingStatus = proAegisPilotProgress.status.replace(/-/g, ' ')

  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">Phase 2 operations</p><h2>Evidence review pipeline</h2></div><span className="section-meta">No metadata-only record is counted as reviewed</span></div>
    <div className="pro-lab__audit-strip">
      <span><strong>{proLabReleaseStats.rankedReviewTargets}</strong>ranked VODs</span>
      <span><strong>{proAegisPilotReviewBatch.length}</strong>Aegis pilot targets</span>
      <span><strong>{validationErrors}</strong>validation errors</span>
      <span><strong>{validationWarnings}</strong>validation warnings</span>
    </div>

    <div className="pro-lab__two-column">
      <article className="pro-lab__pattern">
        <strong>Pyra / Mythra pilot sampling</strong>
        <p>{proAegisPilotProgress.reviewedSetCount}/{proAegisPilotProgress.samplingSetTarget} reviewed sets · {proAegisPilotProgress.representativePlayerCount} reviewed representatives · {proAegisPilotProgress.opponentFighterCount} opponent fighters · {proAegisPilotProgress.contextCount} decision contexts</p>
        <span>{samplingStatus}. Sampling readiness is a diversity heuristic only; it does not bypass the teaching-ready evidence gate.</span>
      </article>
      <article className="pro-lab__pattern">
        <strong>Roster pipeline</strong>
        <p>{proCoverageSummary.teachingReady} teaching ready · {proCoverageSummary.evidenceBuilding} evidence building · {proCoverageSummary.cataloged} cataloged · {proCoverageSummary.representativeSeeded} representative seeded · {proCoverageSummary.researchQueued} research queued</p>
        <span>Strict review intake is prepared for {proAegisPilotSubmissionTemplates.length} Aegis pilot sets; a template cannot validate until direct gameplay observations and an evidence-backed breakdown are added.</span>
      </article>
    </div>

    <div className="section-heading"><div><p className="eyebrow">Completion queue</p><h2>Highest Pro Lab content gaps</h2></div><span className="section-meta">12-set / 2-representative floors plus evidence depth</span></div>
    <div className="pro-lab__card-grid">
      {proCoverageWorkQueue.slice(0, 8).map((item) => {
        const fighter = fighterById.get(item.fighterId)
        return <article className="pro-lab__card" key={item.fighterId}>
          <div className="pro-lab__card-top"><h3>#{item.rank} {fighter?.name ?? item.fighterId}</h3><span>{actionLabel(item.nextAction)}</span></div>
          <p>{item.state.replace(/-/g, ' ')} · planning score {item.score}</p>
          <p>{item.reasons.slice(0, 3).join(' · ')}</p>
          <p>{item.reviewedSetCount} reviewed sets · {item.reviewedMomentGap} reviewed moments still needed for the planning floor.</p>
          {fighter && <div className="pro-lab__link-row"><a href={hrefFor(`/pro-lab/${fighter.slug}`)}>Open fighter workspace →</a></div>}
        </article>
      })}
    </div>

    <div className="section-heading"><div><p className="eyebrow">Pilot review pack</p><h2>Primary-side Aegis footage</h2></div><span className="section-meta">{proAegisPilotReviewBatch.length} deterministic targets</span></div>
    <div className="pro-lab__card-grid">
      {proAegisPilotReviewBatch.map((target) => {
        const worksheet = worksheetByVod.get(target.vodId)
        const submissionTemplate = submissionTemplateByVod.get(target.vodId)
        const reviewUrl = worksheet?.startSeconds === undefined
          ? target.videoUrl
          : `${target.videoUrl}${target.videoUrl.includes('?') ? '&' : '?'}t=${Math.floor(worksheet.startSeconds)}s`
        return <article className="pro-lab__card" key={target.vodId}>
          <div className="pro-lab__card-top"><h3>#{target.rank} {worksheet?.title ?? `${target.playerId} vs ${target.opponentTag}`}</h3><span>{target.eventTier}</span></div>
          <p>{target.event} · {target.date}{worksheet?.round ? ` · ${worksheet.round}` : ''}</p>
          {worksheet && <p><strong>{formatFighters(worksheet.playerFighterIds)}</strong> vs. {formatFighters(worksheet.opponentFighterIds)}</p>}
          <p>{target.reasons.slice(0, 3).join(' · ')}</p>
          <p><strong>Gameplay observations pending.</strong> This worksheet contains navigation and confirmed catalog metadata only.</p>
          <div className="pro-lab__link-row"><a href={reviewUrl} target="_blank" rel="noreferrer">Open VOD ↗</a></div>
          {worksheet && <details><summary>Evidence-safe review checklist</summary><ul>{worksheet.checklist.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {submissionTemplate && <details><summary>Strict intake state</summary><p>Target: {submissionTemplate.targetStatus}. Current template contains {submissionTemplate.moments.length} gameplay observations and remains intentionally unvalidated until a reviewer adds direct evidence.</p></details>}
        </article>
      })}
    </div>
  </section>
}
