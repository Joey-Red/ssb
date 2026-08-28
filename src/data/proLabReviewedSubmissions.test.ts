import { describe, expect, it } from 'vitest'
import {
  proDecisionMoments,
  proEvidenceRegistry,
  proLabReleaseStats,
  proRankedVodReviewPlan,
  proSetBreakdowns,
  proVodCatalog,
  proVodReviewQueueStats,
} from './proLab'
import { proReviewedSubmissions } from './proLabReviewedSubmissions'

describe('checked-in Pro Lab reviewed evidence', () => {
  it('ships only validator-clean production submissions', () => {
    expect(proEvidenceRegistry.valid).toBe(true)
    expect(proEvidenceRegistry.errors).toEqual([])
    expect(proEvidenceRegistry.rejectedSubmissions).toEqual([])
    expect(proEvidenceRegistry.sourceSubmissionCount).toBe(proReviewedSubmissions.length)
    expect(proEvidenceRegistry.acceptedSubmissions).toHaveLength(proReviewedSubmissions.length)
  })

  it('derives all tactical production data from accepted submissions', () => {
    const acceptedMomentCount = proEvidenceRegistry.acceptedSubmissions.reduce(
      (total, submission) => total + submission.moments.length,
      0,
    )
    expect(proDecisionMoments).toHaveLength(acceptedMomentCount)
    expect(proSetBreakdowns).toHaveLength(proVodCatalog.length)
    expect(proLabReleaseStats.checkedInReviewSubmissions).toBe(proReviewedSubmissions.length)
    expect(proLabReleaseStats.acceptedReviewSubmissions).toBe(proReviewedSubmissions.length)
    expect(proLabReleaseStats.rejectedReviewSubmissions).toBe(0)
    expect(proLabReleaseStats.evidenceRegistryErrors).toBe(0)
  })

  it('keeps analyzed VOD status owned by a checked-in submission', () => {
    const submissionByVod = new Map(proReviewedSubmissions.map((submission) => [submission.vodId, submission]))
    const breakdownByVod = new Map(proSetBreakdowns.map((breakdown) => [breakdown.vodId, breakdown]))

    for (const vod of proVodCatalog) {
      const submission = submissionByVod.get(vod.id)
      if (vod.analysisStatus === 'annotated' || vod.analysisStatus === 'reviewed') {
        expect(submission, vod.id).toBeTruthy()
        expect(vod.analysisStatus, vod.id).toBe(submission?.targetStatus)
        expect(breakdownByVod.get(vod.id), vod.id).toEqual(submission?.breakdown)
      } else {
        expect(submission, vod.id).toBeUndefined()
        expect(breakdownByVod.get(vod.id)?.status, vod.id).toBe('queued')
      }
    }
  })

  it('removes reviewed VODs from pending ranked review work', () => {
    const reviewedIds = new Set(
      proVodCatalog.filter((vod) => vod.analysisStatus === 'reviewed').map((vod) => vod.id),
    )
    expect(proRankedVodReviewPlan.every((target) => !reviewedIds.has(target.vodId))).toBe(true)
    expect(proVodReviewQueueStats.reviewed).toBe(reviewedIds.size)
    expect(proVodReviewQueueStats.pending + proVodReviewQueueStats.reviewed).toBe(proVodReviewQueueStats.totalTargets)
  })
})
