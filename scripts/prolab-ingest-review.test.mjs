import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  detectReviewConflicts,
  ingestReviewSubmission,
  renderReviewIndex,
  reviewFileNameForVodId,
  validateSubmissionEnvelope,
} from './prolab-ingest-review.mjs'

const submission = (vodId = 'vod-a', momentId = `${vodId}-moment-1`) => ({
  vodId,
  targetStatus: 'annotated',
  moments: [{
    id: momentId,
    vodId,
    game: 1,
    timestampSeconds: 42,
    fighterId: 'mythra',
    opponentFighterId: 'cloud',
    context: 'neutral',
    state: {},
    chosenOption: 'dash back then forward air',
    observableOutcome: 'forward air connected',
    evidenceClass: 'observed',
    confidence: 0.9,
    teachingTags: ['whiff-punish'],
  }],
  breakdown: {
    vodId,
    status: 'annotated',
    phaseSummaries: [],
    decisionMomentIds: [momentId],
    recurringHabits: [],
    adaptationNotes: [],
    reviewerNotes: ['Direct footage review completed.'],
  },
})

describe('Pro Lab review ingestion CLI', () => {
  it('accepts the workbench submission envelope and rejects malformed ownership', () => {
    expect(validateSubmissionEnvelope(submission()).errors).toEqual([])

    const bad = submission()
    bad.breakdown.vodId = 'other-vod'
    bad.moments[0].vodId = 'other-vod'
    const parsed = validateSubmissionEnvelope(bad)
    expect(parsed.submission).toBeNull()
    expect(parsed.errors).toContain('breakdown.vodId must match submission vodId.')
    expect(parsed.errors).toContain('moments[0].vodId must match submission vodId.')
  })

  it('requires safe deterministic per-VOD filenames', () => {
    expect(reviewFileNameForVodId('kagaribi15-stream-sparg0-mkleo-wqf')).toBe('kagaribi15-stream-sparg0-mkleo-wqf.json')
    expect(() => reviewFileNameForVodId('../escape')).toThrow(/Unsafe VOD id/)
  })

  it('preflights duplicate VOD ownership and global moment IDs', () => {
    const existing = [submission('vod-a', 'shared-moment')]
    expect(detectReviewConflicts(submission('vod-a', 'new-moment'), existing)).toContain(
      'A checked-in review already owns VOD vod-a. Use --replace to update it.',
    )
    expect(detectReviewConflicts(submission('vod-b', 'shared-moment'), existing)).toContain(
      'Moment id shared-moment already belongs to reviewed VOD vod-a.',
    )
    expect(detectReviewConflicts(submission('vod-a', 'shared-moment'), existing, 'vod-a')).toEqual([])
  })

  it('renders a deterministic typed index for JSON review files', () => {
    const output = renderReviewIndex(['z-vod.json', 'a-vod.json'])
    expect(output.indexOf("import review0 from './a-vod.json'")).toBeLessThan(output.indexOf("import review1 from './z-vod.json'"))
    expect(output).toContain('review0 as unknown as ProReviewSubmission')
    expect(output).toContain('review1 as unknown as ProReviewSubmission')
  })

  it('writes canonical per-VOD JSON and regenerates the index atomically before the quality gate', () => {
    const root = mkdtempSync(join(tmpdir(), 'prolab-ingest-'))
    try {
      const inputPath = join(root, 'submission.json')
      const reviewDir = join(root, 'reviews')
      const indexPath = join(reviewDir, 'index.ts')
      writeFileSync(inputPath, JSON.stringify(submission(), null, 2))

      const result = ingestReviewSubmission({ inputPath, reviewDir, indexPath, runQualityGate: false })
      expect(existsSync(result.targetPath)).toBe(true)
      expect(JSON.parse(readFileSync(result.targetPath, 'utf8'))).toEqual(submission())
      expect(readFileSync(indexPath, 'utf8')).toContain("import review0 from './vod-a.json'")
      expect(() => ingestReviewSubmission({ inputPath, reviewDir, indexPath, runQualityGate: false })).toThrow(/already exists/)

      const replacement = submission()
      replacement.reviewerNote = 'replacement marker'
      writeFileSync(inputPath, JSON.stringify(replacement, null, 2))
      ingestReviewSubmission({ inputPath, reviewDir, indexPath, replace: true, runQualityGate: false })
      expect(JSON.parse(readFileSync(result.targetPath, 'utf8')).reviewerNote).toBe('replacement marker')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
