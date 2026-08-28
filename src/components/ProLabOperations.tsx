import {
  proCoverageDistributionAudit,
  proCoverageWorkQueue,
  proLabReleaseStats,
  proRosterReviewBatch,
  proRosterReviewBatchStats,
  proRosterReviewSubmissionTemplates,
  proRosterReviewWorksheets,
} from '../data/proLab'
import { roster } from '../data/roster'
import { defaultProCoverageGoals } from '../lib/proLabCoveragePlanning'
import { hrefFor } from '../router'
import type { FighterManifestEntry } from '../types'

const fighterById = new Map<string, FighterManifestEntry>(roster.map((fighter) => [fighter.id, fighter]))
const worksheetByVod = new Map(proRosterReviewWorksheets.map((worksheet) => [worksheet.vodId, worksheet]))
const submissionTemplateByVod = new Map(proRosterReviewSubmissionTemplates.map((submission) => [submission.vodId, submission]))
const formatFighters = (fighterIds: readonly string[]) => fighterIds.map((id) => fighterById.get(id)?.name ?? id).join(' / ')
const actionLabel = (value: string) => value.replace(/-/g, ' ')
const floorValue = (actual: number, floor: number) => `${actual}/${floor}`

export function ProLabOperations() {
  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">Phase 2 operations</p><h2>Evidence review pipeline</h2></div><span className="section-meta">No metadata-only record is counted as reviewed</span></div>
    <div className="pro-lab__audit-strip">
      <span><strong>{proLabReleaseStats.rankedReviewTargets}</strong>ranked VODs</span>
      <span><strong>{proLabReleaseStats.acceptedReviewSubmissions}</strong>accepted reviews</span>
      <span><strong>{proLabReleaseStats.phase2ValidationErrors}</strong>validation errors</span>
      <span><strong>{proLabReleaseStats.phase2ValidationWarnings}</strong>validation warnings</span>
    </div>

    <div className="pro-lab__two-column">
      <article className="pro-lab__pattern">
        <strong>Roster-neutral review allocation</strong>
        <p>{proRosterReviewBatchStats.targetCount} queued sets · {proRosterReviewBatchStats.primaryFighterCount} primary-side fighters · {proRosterReviewBatchStats.representativePlayerCount} representatives · {proRosterReviewBatchStats.opponentFighterCount} opponent fighters</p>
        <span>Targets come from the coverage-gap queue and global evidence ranking only. There is no hard-coded pilot fighter or user-preference boost.</span>
      </article>
      <article className="pro-lab__pattern">
        <strong>Production evidence registry</strong>
        <p>{proLabReleaseStats.checkedInReviewSubmissions} checked in · {proLabReleaseStats.acceptedReviewSubmissions} accepted · {proLabReleaseStats.rejectedReviewSubmissions} rejected · {proLabReleaseStats.reviewedReviewTargets} fully reviewed VODs</p>
        <span>Only validator-clean checked-in submissions can change VOD status or feed lessons, exercises, matchup patterns, comparisons, and coverage.</span>
      </article>
    </div>

    <div className="section-heading"><div><p className="eyebrow">M72 distribution audit</p><h2>Roster-wide evidence depth</h2></div><span className="section-meta">All {proCoverageDistributionAudit.fighterCount} fighters · objective coverage-gap order</span></div>
    <div className="pro-lab__audit-strip pro-lab__audit-strip--coverage">
      <span><strong>{proLabReleaseStats.vodLearningRecords}</strong>live VOD records</span>
      <span><strong>{proCoverageDistributionAudit.zeroVodFighterCount}</strong>fighters with zero VODs</span>
      <span><strong>{proCoverageDistributionAudit.vodFloorMetCount}/{proCoverageDistributionAudit.fighterCount}</strong>meet 12-VOD floor</span>
      <span><strong>{proCoverageDistributionAudit.currentVodFloorMetCount}/{proCoverageDistributionAudit.fighterCount}</strong>meet 4-current floor</span>
      <span><strong>{proCoverageDistributionAudit.representativeFloorMetCount}/{proCoverageDistributionAudit.fighterCount}</strong>meet 2-rep floor</span>
      <span><strong>{proCoverageDistributionAudit.reviewedSetFloorMetCount}/{proCoverageDistributionAudit.fighterCount}</strong>meet 8-reviewed-set floor</span>
      <span><strong>{proCoverageDistributionAudit.reviewedMomentFloorMetCount}/{proCoverageDistributionAudit.fighterCount}</strong>meet 16-moment floor</span>
      <span><strong>{proCoverageDistributionAudit.severeVodDeficitCount}</strong>below half of VOD floor</span>
    </div>
    <p className="pro-lab__distribution-note">
      Primary-side VOD depth: <strong>{proCoverageDistributionAudit.minimumVodCount}</strong> minimum · <strong>{proCoverageDistributionAudit.medianVodCount}</strong> median · <strong>{proCoverageDistributionAudit.maximumVodCount}</strong> maximum. Remaining planning gaps: <strong>{proCoverageDistributionAudit.totalVodGap}</strong> VOD appearances · <strong>{proCoverageDistributionAudit.totalCurrentVodGap}</strong> current-era appearances · <strong>{proCoverageDistributionAudit.totalRepresentativeGap}</strong> representative slots. These are planning floors, not permission to add weak evidence.
    </p>
    <div className="pro-lab__distribution-table-wrap" role="region" aria-label="Roster-wide Pro Lab coverage distribution" tabIndex={0}>
      <table className="pro-lab__distribution-table">
        <caption>All fighters ranked by the same roster-neutral evidence deficit score used by the acquisition and review queues.</caption>
        <thead><tr><th scope="col">Rank</th><th scope="col">Fighter</th><th scope="col">VODs</th><th scope="col">Current</th><th scope="col">Reps</th><th scope="col">Reviewed sets</th><th scope="col">Moments</th><th scope="col">Planning deficits</th><th scope="col">Next action</th></tr></thead>
        <tbody>
          {proCoverageWorkQueue.map((item) => {
            const fighter = fighterById.get(item.fighterId)
            return <tr key={item.fighterId}>
              <td>#{item.rank}</td>
              <th scope="row">{fighter ? <a href={hrefFor(`/pro-lab/${fighter.slug}`)}>{fighter.name}</a> : item.fighterId}</th>
              <td className={item.vodGap === 0 ? 'is-floor-met' : undefined}>{floorValue(item.vodCount, defaultProCoverageGoals.vodFloor)}</td>
              <td className={item.currentVodGap === 0 ? 'is-floor-met' : undefined}>{floorValue(item.currentVodCount, defaultProCoverageGoals.currentVodFloor)}</td>
              <td className={item.representativeGap === 0 ? 'is-floor-met' : undefined}>{floorValue(item.representativeCount, defaultProCoverageGoals.representativeFloor)}</td>
              <td className={item.reviewedSetGap === 0 ? 'is-floor-met' : undefined}>{floorValue(item.reviewedSetCount, defaultProCoverageGoals.reviewedSetFloor)}</td>
              <td className={item.reviewedMomentGap === 0 ? 'is-floor-met' : undefined}>{floorValue(item.reviewedMomentCount, defaultProCoverageGoals.reviewedMomentFloor)}</td>
              <td><span className="pro-lab__distribution-gaps">V {item.vodGap} · C {item.currentVodGap} · R {item.representativeGap} · S {item.reviewedSetGap} · M {item.reviewedMomentGap}</span></td>
              <td><span className="pro-lab__distribution-action" title={item.reasons.join(' · ')}>{actionLabel(item.nextAction)}</span></td>
            </tr>
          })}
        </tbody>
      </table>
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

    <div className="section-heading"><div><p className="eyebrow">Balanced review pack</p><h2>Coverage-priority primary-side footage</h2></div><span className="section-meta">{proRosterReviewBatch.length} deterministic targets</span></div>
    <div className="pro-lab__card-grid">
      {proRosterReviewBatch.map((target) => {
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
          <div className="pro-lab__link-row"><a href={reviewUrl} target="_blank" rel="noreferrer">Open VOD ↗</a><a href={hrefFor(`/pro-lab/review/${encodeURIComponent(target.vodId)}`)}>Review evidence →</a></div>
          {worksheet && <details><summary>Evidence-safe review checklist</summary><ul>{worksheet.checklist.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {submissionTemplate && <details><summary>Strict intake state</summary><p>Target: {submissionTemplate.targetStatus}. Current template contains {submissionTemplate.moments.length} gameplay observations and remains intentionally unvalidated until a reviewer adds direct evidence.</p></details>}
        </article>
      })}
    </div>
  </section>
}
