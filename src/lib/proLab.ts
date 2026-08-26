import { minimumCatalogQualityScore, proVodQualityRules } from '../data/proLabPolicy'
import type {
  ProDecisionMoment,
  ProPatternSummary,
  ProSetBreakdown,
  ProVodQuality,
} from '../data/proLabTypes'

export interface ProVodQualitySignals {
  competitionEnvironment: boolean
  fullSet: boolean
  officialOrTournamentChannel: boolean
  visibleGameplay: boolean
  patchKnown: boolean
  strongOpposition: boolean
  characterConfirmed: boolean
  provenance: boolean
}

const signalByRuleId = (signals: ProVodQualitySignals, ruleId: string) => {
  switch (ruleId) {
    case 'competition-environment':
      return signals.competitionEnvironment
    case 'full-set':
      return signals.fullSet
    case 'visible-gameplay':
      return signals.visibleGameplay
    case 'source-quality':
      return signals.officialOrTournamentChannel
    case 'recent-patch':
      return signals.patchKnown
    case 'strong-opposition':
      return signals.strongOpposition
    case 'character-confirmed':
      return signals.characterConfirmed
    case 'provenance':
      return signals.provenance
    default:
      return false
  }
}

export function buildProVodQuality(signals: ProVodQualitySignals, notes: readonly string[] = []): ProVodQuality {
  const score = proVodQualityRules.reduce(
    (total, rule) => total + (signalByRuleId(signals, rule.id) ? rule.weight : 0),
    0,
  )

  return {
    tournamentEnvironment: signals.competitionEnvironment,
    fullSet: signals.fullSet,
    officialOrTournamentChannel: signals.officialOrTournamentChannel,
    visibleGameplay: signals.visibleGameplay,
    patchKnown: signals.patchKnown,
    score,
    notes,
  }
}

export function passesRequiredVodQuality(signals: ProVodQualitySignals) {
  return proVodQualityRules
    .filter((rule) => rule.required)
    .every((rule) => signalByRuleId(signals, rule.id))
}

export function isCatalogQuality(quality: ProVodQuality) {
  return quality.score >= minimumCatalogQualityScore
}

export function isTeachingEligibleMoment(moment: ProDecisionMoment) {
  return moment.evidenceClass !== 'speculative' && moment.confidence >= 0.65
}

export function buildSetBreakdown(vodId: string, moments: readonly ProDecisionMoment[]): ProSetBreakdown {
  const eligible = moments
    .filter((moment) => moment.vodId === vodId)
    .filter(isTeachingEligibleMoment)
    .sort((a, b) => a.game - b.game || a.timestampSeconds - b.timestampSeconds)

  if (eligible.length === 0) {
    return {
      vodId,
      status: 'queued',
      phaseSummaries: [],
      decisionMomentIds: [],
      recurringHabits: [],
      adaptationNotes: [],
      reviewerNotes: ['No reviewed decision moments have been attached to this set yet.'],
    }
  }

  const games = new Map<number, ProDecisionMoment[]>()
  for (const moment of eligible) {
    const gameMoments = games.get(moment.game) ?? []
    gameMoments.push(moment)
    games.set(moment.game, gameMoments)
  }

  return {
    vodId,
    status: 'annotated',
    phaseSummaries: [...games.entries()].map(([game, gameMoments]) => ({
      label: `Game ${game}`,
      startGame: game,
      endGame: game,
      summary: `${gameMoments.length} reviewed teaching moment${gameMoments.length === 1 ? '' : 's'} recorded for this game.`,
      evidenceMomentIds: gameMoments.map((moment) => moment.id),
    })),
    decisionMomentIds: eligible.map((moment) => moment.id),
    recurringHabits: [],
    adaptationNotes: eligible
      .filter((moment) => moment.context === 'adaptation' && moment.interpretation)
      .map((moment) => moment.interpretation as string),
  }
}

interface PatternAccumulator {
  fighterId: string
  context: ProDecisionMoment['context']
  teachingTag: string
  playerIds: Set<string>
  vodIds: Set<string>
  evidenceMomentIds: string[]
  confidenceTotal: number
}

export interface PatternExtractionOptions {
  minimumOccurrences?: number
  minimumVods?: number
  playerIdByVod?: Readonly<Record<string, string>>
}

export function extractProPatterns(
  moments: readonly ProDecisionMoment[],
  options: PatternExtractionOptions = {},
): readonly ProPatternSummary[] {
  const minimumOccurrences = options.minimumOccurrences ?? 2
  const minimumVods = options.minimumVods ?? 2
  const groups = new Map<string, PatternAccumulator>()

  for (const moment of moments.filter(isTeachingEligibleMoment)) {
    for (const rawTag of moment.teachingTags) {
      const teachingTag = rawTag.trim().toLowerCase()
      if (!teachingTag) continue

      const key = `${moment.fighterId}|${moment.context}|${teachingTag}`
      const existing = groups.get(key) ?? {
        fighterId: moment.fighterId,
        context: moment.context,
        teachingTag,
        playerIds: new Set<string>(),
        vodIds: new Set<string>(),
        evidenceMomentIds: [],
        confidenceTotal: 0,
      }

      const playerId = options.playerIdByVod?.[moment.vodId]
      if (playerId) existing.playerIds.add(playerId)
      existing.vodIds.add(moment.vodId)
      existing.evidenceMomentIds.push(moment.id)
      existing.confidenceTotal += moment.confidence
      groups.set(key, existing)
    }
  }

  return [...groups.values()]
    .filter(
      (group) =>
        group.evidenceMomentIds.length >= minimumOccurrences && group.vodIds.size >= minimumVods,
    )
    .map((group) => {
      const occurrenceCount = group.evidenceMomentIds.length
      const vodCount = group.vodIds.size
      return {
        id: `${group.fighterId}-${group.context}-${group.teachingTag.replace(/[^a-z0-9]+/g, '-')}`,
        fighterId: group.fighterId,
        playerIds: [...group.playerIds].sort(),
        context: group.context,
        teachingTag: group.teachingTag,
        occurrenceCount,
        vodCount,
        evidenceMomentIds: group.evidenceMomentIds,
        statement: `Observed ${group.teachingTag} in ${occurrenceCount} reviewed moments across ${vodCount} competitive sets.`,
        confidence: group.confidenceTotal / occurrenceCount,
      }
    })
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.id.localeCompare(b.id))
}
