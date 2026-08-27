import type { ProDecisionMoment, ProFighterCoverage } from '../data/proLabTypes'
import { isTeachingEligibleMoment } from './proLab'

export interface ProCoverageGoals {
  readonly representativeFloor: number
  readonly vodFloor: number
  readonly currentVodFloor: number
  readonly reviewedSetFloor: number
  readonly reviewedMomentFloor: number
  readonly lessonClaimFloor: number
  readonly decisionExerciseFloor: number
  readonly matchupPatternFloor: number
}

export type ProCoverageNextAction =
  | 'acquire-representatives'
  | 'acquire-vods'
  | 'review-vods'
  | 'expand-teaching'
  | 'expand-matchups'
  | 'compare-players'
  | 'maintain'

export interface ProCoverageWorkItem {
  readonly rank: number
  readonly fighterId: string
  readonly score: number
  readonly state: ProFighterCoverage['state']
  readonly nextAction: ProCoverageNextAction
  readonly representativeGap: number
  readonly vodGap: number
  readonly currentVodGap: number
  readonly reviewedSetGap: number
  readonly reviewedMomentGap: number
  readonly lessonClaimGap: number
  readonly decisionExerciseGap: number
  readonly matchupPatternGap: number
  readonly comparisonGap: number
  readonly reviewedSetCount: number
  readonly reasons: readonly string[]
}

export const defaultProCoverageGoals: ProCoverageGoals = {
  representativeFloor: 2,
  vodFloor: 12,
  currentVodFloor: 4,
  reviewedSetFloor: 8,
  reviewedMomentFloor: 16,
  lessonClaimFloor: 3,
  decisionExerciseFloor: 6,
  matchupPatternFloor: 2,
}

const stateWeight: Readonly<Record<ProFighterCoverage['state'], number>> = {
  'research-queued': 1200,
  'representative-seeded': 900,
  cataloged: 650,
  'evidence-building': 300,
  'teaching-ready': 0,
}

const gap = (goal: number, actual: number) => Math.max(0, goal - actual)

const reviewedSetsByFighter = (moments: readonly ProDecisionMoment[]) => {
  const sets = new Map<string, Set<string>>()
  for (const moment of moments.filter(isTeachingEligibleMoment)) {
    const fighterSets = sets.get(moment.fighterId) ?? new Set<string>()
    fighterSets.add(moment.vodId)
    sets.set(moment.fighterId, fighterSets)
  }
  return sets
}

const chooseNextAction = (
  coverage: ProFighterCoverage,
  representativeGap: number,
  vodGap: number,
  currentVodGap: number,
  reviewedSetGap: number,
  reviewedMomentGap: number,
  lessonClaimGap: number,
  decisionExerciseGap: number,
  matchupPatternGap: number,
  comparisonGap: number,
): ProCoverageNextAction => {
  // Long-term execution order: build the VOD corpus first, including enough
  // current-era evidence, then broaden representatives, then review gameplay.
  if (vodGap > 0 || currentVodGap > 0) return 'acquire-vods'
  if (representativeGap > 0) return 'acquire-representatives'
  if (reviewedSetGap > 0 || reviewedMomentGap > 0) return 'review-vods'
  if (lessonClaimGap > 0 || decisionExerciseGap > 0) return 'expand-teaching'
  if (matchupPatternGap > 0) return 'expand-matchups'
  if (comparisonGap > 0 && coverage.representativeCount >= 2) return 'compare-players'
  return 'maintain'
}

/**
 * Turns the long-term Pro Lab completion doctrine into an explicit work queue.
 * The numeric floors are planning targets only: they never override the normal
 * evidence validators or make a fighter teaching-ready by themselves.
 */
export function buildProCoverageWorkQueue(
  coverage: readonly ProFighterCoverage[],
  moments: readonly ProDecisionMoment[],
  goals: ProCoverageGoals = defaultProCoverageGoals,
): readonly ProCoverageWorkItem[] {
  const reviewedSets = reviewedSetsByFighter(moments)

  const rows = coverage.map((entry) => {
    const reviewedSetCount = reviewedSets.get(entry.fighterId)?.size ?? 0
    const representativeGap = gap(goals.representativeFloor, entry.representativeCount)
    const vodGap = gap(goals.vodFloor, entry.vodCount)
    const currentVodGap = gap(goals.currentVodFloor, entry.currentVodCount)
    const reviewedSetGap = gap(goals.reviewedSetFloor, reviewedSetCount)
    const reviewedMomentGap = gap(goals.reviewedMomentFloor, entry.reviewedMomentCount)
    const lessonClaimGap = gap(goals.lessonClaimFloor, entry.lessonClaimCount)
    const decisionExerciseGap = gap(goals.decisionExerciseFloor, entry.decisionExerciseCount)
    const matchupPatternGap = gap(goals.matchupPatternFloor, entry.matchupPatternCount)
    const comparisonGap = entry.comparisonReady ? 0 : 1

    const score =
      stateWeight[entry.state]
      + representativeGap * 260
      + vodGap * 34
      + currentVodGap * 30
      + reviewedSetGap * 85
      + reviewedMomentGap * 18
      + lessonClaimGap * 24
      + decisionExerciseGap * 18
      + matchupPatternGap * 30
      + (entry.representativeCount >= 2 ? comparisonGap * 35 : 0)

    const reasons: string[] = []
    if (vodGap > 0) reasons.push(`${vodGap} VOD${vodGap === 1 ? '' : 's'} below the 12-set floor`)
    if (representativeGap > 0) reasons.push(`${representativeGap} representative${representativeGap === 1 ? '' : 's'} below the planning floor`)
    if (currentVodGap > 0) reasons.push(`${currentVodGap} current-era VOD${currentVodGap === 1 ? '' : 's'} below target`)
    if (reviewedSetGap > 0) reasons.push(`${reviewedSetGap} reviewed set${reviewedSetGap === 1 ? '' : 's'} below sampling target`)
    if (reviewedMomentGap > 0) reasons.push(`${reviewedMomentGap} reviewed moment${reviewedMomentGap === 1 ? '' : 's'} below planning target`)
    if (lessonClaimGap > 0) reasons.push(`${lessonClaimGap} lesson claim${lessonClaimGap === 1 ? '' : 's'} below target`)
    if (decisionExerciseGap > 0) reasons.push(`${decisionExerciseGap} decision exercise${decisionExerciseGap === 1 ? '' : 's'} below target`)
    if (matchupPatternGap > 0) reasons.push(`${matchupPatternGap} matchup pattern${matchupPatternGap === 1 ? '' : 's'} below target`)
    if (entry.representativeCount >= 2 && comparisonGap > 0) reasons.push('player comparison evidence is not ready')
    if (reasons.length === 0) reasons.push('planning floors met; prioritize freshness and maintenance')

    return {
      rank: 0,
      fighterId: entry.fighterId,
      score,
      state: entry.state,
      nextAction: chooseNextAction(
        entry,
        representativeGap,
        vodGap,
        currentVodGap,
        reviewedSetGap,
        reviewedMomentGap,
        lessonClaimGap,
        decisionExerciseGap,
        matchupPatternGap,
        comparisonGap,
      ),
      representativeGap,
      vodGap,
      currentVodGap,
      reviewedSetGap,
      reviewedMomentGap,
      lessonClaimGap,
      decisionExerciseGap,
      matchupPatternGap,
      comparisonGap,
      reviewedSetCount,
      reasons,
    } satisfies ProCoverageWorkItem
  })

  return rows
    .sort((a, b) => b.score - a.score || a.fighterId.localeCompare(b.fighterId))
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
