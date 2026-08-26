import type { FighterFrameData, FrameMove } from '../types'
import type {
  ProCharacterLesson,
  ProDecisionExercise,
  ProDecisionMoment,
  ProFighterCoverage,
  ProFighterResearchEntry,
  ProFrameDataReference,
  ProLessonClaim,
  ProLessonTopic,
  ProMaintenanceFinding,
  ProMaintenanceReport,
  ProMatchupPattern,
  ProPatternSummary,
  ProPlayerComparison,
  ProPlayerRepresentative,
  ProPlayerStyleSignal,
  ProPracticeDrillSeed,
  ProResolvedFrameMetric,
  ProResolvedFrameReference,
  ProTemporalEvidence,
  ProVodRecord,
} from '../data/proLabTypes'
import { isCatalogQuality, isTeachingEligibleMoment, type PatternExtractionOptions } from './proLab'

const topicForContext = (context: ProDecisionMoment['context']): ProLessonTopic => {
  if (context === 'neutral') return 'neutral'
  if (context === 'advantage' || context === 'tech-chase' || context === 'shield-pressure') return 'advantage'
  if (context === 'disadvantage') return 'disadvantage'
  if (context === 'ledge') return 'ledgetrapping'
  if (context === 'recovery') return 'recovery'
  if (context === 'punish' || context === 'kill-setup') return 'stock-closing'
  return 'adaptations'
}

export function buildCharacterLessons(
  fighterIds: readonly string[],
  patterns: readonly ProPatternSummary[],
  moments: readonly ProDecisionMoment[],
): readonly ProCharacterLesson[] {
  const momentById = new Map(moments.map((moment) => [moment.id, moment]))
  return fighterIds.map((fighterId) => {
    const fighterPatterns = patterns.filter((pattern) => pattern.fighterId === fighterId)
    const claims: ProLessonClaim[] = fighterPatterns.map((pattern) => {
      const evidence = pattern.evidenceMomentIds.map((id) => momentById.get(id)).filter((item): item is ProDecisionMoment => item !== undefined)
      return {
        id: `lesson-${pattern.id}`,
        fighterId,
        topic: topicForContext(pattern.context),
        statement: `${pattern.teachingTag} recurs in reviewed ${pattern.context.replace(/-/g, ' ')} decisions across ${pattern.vodCount} competitive sets.`,
        evidenceMomentIds: pattern.evidenceMomentIds,
        evidenceVodIds: [...new Set(evidence.map((moment) => moment.vodId))].sort(),
        playerIds: pattern.playerIds,
        confidence: pattern.confidence,
        teachingTags: [pattern.teachingTag],
      }
    })

    if (fighterPatterns.length > 0) {
      const top = [...fighterPatterns].sort((a, b) => b.occurrenceCount - a.occurrenceCount || b.confidence - a.confidence).slice(0, 3)
      const evidenceMomentIds = [...new Set(top.flatMap((pattern) => pattern.evidenceMomentIds))]
      const evidenceVodIds = [...new Set(evidenceMomentIds.map((id) => momentById.get(id)?.vodId).filter((id): id is string => id !== undefined))].sort()
      claims.unshift({
        id: `lesson-${fighterId}-top-player-priorities`,
        fighterId,
        topic: 'top-player-priorities',
        statement: `The strongest repeated reviewed signals are ${top.map((pattern) => pattern.teachingTag).join(', ')}. This is an evidence summary, not a claim about player intent.`,
        evidenceMomentIds,
        evidenceVodIds,
        playerIds: [...new Set(top.flatMap((pattern) => pattern.playerIds))].sort(),
        confidence: top.reduce((sum, pattern) => sum + pattern.confidence, 0) / top.length,
        teachingTags: top.map((pattern) => pattern.teachingTag),
      })
    }

    const evidenceMomentIds = [...new Set(claims.flatMap((claim) => claim.evidenceMomentIds))]
    const vodIds = [...new Set(claims.flatMap((claim) => claim.evidenceVodIds))].sort()
    const playerIds = [...new Set(claims.flatMap((claim) => claim.playerIds))].sort()
    const status: ProCharacterLesson['status'] = claims.length === 0 ? 'evidence-pending' : vodIds.length >= 2 && evidenceMomentIds.length >= 3 ? 'ready' : 'evidence-building'
    return { fighterId, status, claims, playerIds, vodIds, evidenceMomentIds }
  })
}

export function summarizeDecisionState(state: ProDecisionMoment['state']): string {
  const parts: string[] = []
  if (state.playerStocks !== undefined && state.opponentStocks !== undefined) parts.push(`stocks ${state.playerStocks}-${state.opponentStocks}`)
  if (state.playerPercent !== undefined) parts.push(`you at ${state.playerPercent}%`)
  if (state.opponentPercent !== undefined) parts.push(`opponent at ${state.opponentPercent}%`)
  if (state.stage) parts.push(state.stage)
  if (state.position && state.position !== 'unknown') parts.push(`${state.position} position`)
  if (state.resources?.length) parts.push(`resources: ${state.resources.join(', ')}`)
  return parts.length > 0 ? parts.join(' · ') : 'Only the reviewed pre-decision game state is shown.'
}

function deterministicOptions(id: string, raw: readonly string[]) {
  const options = [...new Set(raw.map((value) => value.trim()).filter(Boolean))]
  if (options.length < 2) return options
  const hash = [...id].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0)
  const offset = hash % options.length
  return [...options.slice(offset), ...options.slice(0, offset)]
}

export function buildDecisionExercise(moment: ProDecisionMoment): ProDecisionExercise | null {
  if (!isTeachingEligibleMoment(moment)) return null
  const options = deterministicOptions(moment.id, [moment.chosenOption, ...(moment.plausibleAlternatives ?? [])])
  if (options.length < 2) return null
  return {
    id: `exercise-${moment.id}`,
    momentId: moment.id,
    vodId: moment.vodId,
    fighterId: moment.fighterId,
    opponentFighterId: moment.opponentFighterId,
    game: moment.game,
    timestampSeconds: moment.timestampSeconds,
    context: moment.context,
    prompt: `What would you do here? ${summarizeDecisionState(moment.state)}`,
    state: moment.state,
    options,
    actualOption: moment.chosenOption,
    observableOutcome: moment.observableOutcome,
    explanation: moment.interpretation,
    evidenceClass: moment.evidenceClass,
    confidence: moment.confidence,
    frameDataReferences: moment.frameDataReferences ?? [],
  }
}

export const buildDecisionExercises = (moments: readonly ProDecisionMoment[]) =>
  moments.map(buildDecisionExercise).filter((exercise): exercise is ProDecisionExercise => exercise !== null)

const metricLabels: Readonly<Record<ProFrameDataReference['metrics'][number], string>> = {
  startup: 'Startup', active: 'Active', totalFrames: 'Total frames', faf: 'FAF', landingLag: 'Landing lag', onShield: 'On shield',
}
const normalizedName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
const metricValue = (move: FrameMove, key: ProFrameDataReference['metrics'][number]): string | null => move[key]

export function resolveFrameDataReference(fighterData: FighterFrameData | undefined, reference: ProFrameDataReference): ProResolvedFrameReference | null {
  if (!fighterData || fighterData.fighterId !== reference.fighterId) return null
  const move = reference.moveId
    ? fighterData.moves.find((entry) => entry.id === reference.moveId)
    : fighterData.moves.find((entry) => normalizedName(entry.name) === normalizedName(reference.moveName))
  if (!move) return null
  const metrics: ProResolvedFrameMetric[] = reference.metrics.map((key) => ({ key, label: metricLabels[key], value: metricValue(move, key) }))
  return { fighterId: fighterData.fighterId, moveId: move.id, moveName: move.name, sourceUrl: fighterData.sourceUrl, metrics, note: reference.note }
}

export function buildPracticeDrillFromMoment(moment: ProDecisionMoment): ProPracticeDrillSeed | null {
  if (!isTeachingEligibleMoment(moment)) return null
  const objective = moment.teachingTags[0]?.trim() || moment.context.replace(/-/g, ' ')
  const setup = summarizeDecisionState(moment.state)
  return {
    fighterId: moment.fighterId,
    title: `Pro Lab: ${objective}`,
    setup,
    route: [moment.chosenOption],
    percent: Number.isInteger(moment.state.playerPercent) ? moment.state.playerPercent as number : null,
    targetReps: 10,
    notes: `Setup: ${setup}. Objective: ${objective}. Reviewed evidence ${moment.id} from ${moment.vodId}. Observed result: ${moment.observableOutcome}`,
    teachingObjective: objective,
    evidenceMomentId: moment.id,
    vodId: moment.vodId,
  }
}

interface PatternGroup {
  fighterId: string
  opponentFighterId: string
  context: ProDecisionMoment['context']
  tag: string
  playerIds: Set<string>
  vodIds: Set<string>
  momentIds: string[]
  confidence: number
}

export function extractMatchupPatterns(moments: readonly ProDecisionMoment[], options: PatternExtractionOptions = {}): readonly ProMatchupPattern[] {
  const groups = new Map<string, PatternGroup>()
  for (const moment of moments.filter(isTeachingEligibleMoment)) {
    if (!moment.opponentFighterId) continue
    for (const rawTag of moment.teachingTags) {
      const tag = rawTag.trim().toLowerCase()
      if (!tag) continue
      const key = `${moment.fighterId}|${moment.opponentFighterId}|${moment.context}|${tag}`
      const group = groups.get(key) ?? { fighterId: moment.fighterId, opponentFighterId: moment.opponentFighterId, context: moment.context, tag, playerIds: new Set<string>(), vodIds: new Set<string>(), momentIds: [], confidence: 0 }
      const playerId = options.playerIdByVod?.[moment.vodId]
      if (playerId) group.playerIds.add(playerId)
      group.vodIds.add(moment.vodId)
      group.momentIds.push(moment.id)
      group.confidence += moment.confidence
      groups.set(key, group)
    }
  }
  const minimumOccurrences = options.minimumOccurrences ?? 2
  const minimumVods = options.minimumVods ?? 2
  return [...groups.values()]
    .filter((group) => group.momentIds.length >= minimumOccurrences && group.vodIds.size >= minimumVods)
    .map((group) => ({
      id: `matchup-${group.fighterId}-${group.opponentFighterId}-${group.context}-${group.tag.replace(/[^a-z0-9]+/g, '-')}`,
      fighterId: group.fighterId,
      opponentFighterId: group.opponentFighterId,
      context: group.context,
      teachingTag: group.tag,
      occurrenceCount: group.momentIds.length,
      vodCount: group.vodIds.size,
      playerIds: [...group.playerIds].sort(),
      evidenceMomentIds: group.momentIds,
      statement: `${group.tag} repeated in ${group.momentIds.length} reviewed ${group.fighterId} vs. ${group.opponentFighterId} moments across ${group.vodIds.size} sets.`,
      confidence: group.confidence / group.momentIds.length,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.id.localeCompare(b.id))
}

export function buildPlayerComparisons(moments: readonly ProDecisionMoment[], playerIdByVod: Readonly<Record<string, string>>): readonly ProPlayerComparison[] {
  const eligible = moments.filter(isTeachingEligibleMoment)
  const fighterIds = [...new Set(eligible.map((moment) => moment.fighterId))]
  const comparisons: ProPlayerComparison[] = []
  for (const fighterId of fighterIds) {
    const fighterMoments = eligible.filter((moment) => moment.fighterId === fighterId)
    const playerIds = [...new Set(fighterMoments.map((moment) => playerIdByVod[moment.vodId]).filter((id): id is string => id !== undefined))].sort()
    if (playerIds.length < 2) continue
    const playerSignals: Record<string, readonly ProPlayerStyleSignal[]> = {}
    for (const playerId of playerIds) {
      const playerMoments = fighterMoments.filter((moment) => playerIdByVod[moment.vodId] === playerId)
      const keys = [...new Set(playerMoments.flatMap((moment) => moment.teachingTags.map((tag) => `${moment.context}|${tag.trim().toLowerCase()}`)))]
      playerSignals[playerId] = keys.filter((key) => !key.endsWith('|')).map((key) => {
        const [context, teachingTag] = key.split('|') as [ProDecisionMoment['context'], string]
        const evidence = playerMoments.filter((moment) => moment.context === context && moment.teachingTags.some((tag) => tag.trim().toLowerCase() === teachingTag))
        return {
          teachingTag,
          context,
          occurrenceCount: evidence.length,
          vodCount: new Set(evidence.map((moment) => moment.vodId)).size,
          evidenceMomentIds: evidence.map((moment) => moment.id),
          confidence: evidence.reduce((sum, moment) => sum + moment.confidence, 0) / evidence.length,
        }
      })
    }
    const tagSets = playerIds.map((id) => new Set(playerSignals[id]?.map((signal) => signal.teachingTag) ?? []))
    const sharedSignals = [...(tagSets[0] ?? new Set<string>())].filter((tag) => tagSets.slice(1).every((set) => set.has(tag))).sort()
    const ready = playerIds.every((id) => {
      const signals = playerSignals[id] ?? []
      return new Set(signals.flatMap((signal) => signal.evidenceMomentIds)).size >= 2 && signals.some((signal) => signal.vodCount >= 2)
    })
    comparisons.push({ fighterId, playerIds, sharedSignals, playerSignals, evidenceMomentIds: fighterMoments.map((moment) => moment.id).sort(), status: ready ? 'ready' : 'evidence-building' })
  }
  return comparisons.sort((a, b) => a.fighterId.localeCompare(b.fighterId))
}

const DAY_MS = 86_400_000
const dateValue = (value: string) => {
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function classifyVodEvidenceEra(vod: ProVodRecord, playerStatus: ProPlayerRepresentative['status'], referenceDate: string): ProTemporalEvidence {
  const event = dateValue(vod.date)
  const reference = dateValue(referenceDate)
  const reasons: string[] = []
  let era: ProTemporalEvidence['era'] = 'legacy'
  if (playerStatus === 'legacy') reasons.push('Representative is explicitly marked legacy.')
  else if (event !== null && reference !== null) {
    const ageDays = Math.max(0, Math.floor((reference - event) / DAY_MS))
    if (ageDays <= 730) { era = 'current'; reasons.push('Tournament evidence is within the two-year current-evidence window.') }
    else if (ageDays <= 1460) { era = 'recent'; reasons.push('Tournament evidence is older than current but inside the four-year recent window.') }
    else reasons.push('Tournament evidence is older than the four-year recent-evidence window.')
  } else reasons.push('Event date could not be classified safely.')
  if (vod.gameVersion === 'unknown') reasons.push('Exact game-version metadata is unknown and is not inferred from the event date.')
  else reasons.push(`Game version is recorded as ${vod.gameVersion}.`)
  return { vodId: vod.id, era, eventDate: vod.date, gameVersion: vod.gameVersion, playerStatus, reasons }
}

export function buildTemporalEvidenceIndex(vods: readonly ProVodRecord[], players: readonly ProPlayerRepresentative[], referenceDate: string) {
  const playersById = new Map(players.map((player) => [player.id, player]))
  return vods.map((vod) => classifyVodEvidenceEra(vod, playersById.get(vod.playerId)?.status ?? 'active', referenceDate))
}

const safeUrl = (value: string) => { try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false } }

export function auditProLabCatalog(vods: readonly ProVodRecord[], fighterIds: readonly string[], temporal: readonly ProTemporalEvidence[], referenceDate: string): ProMaintenanceReport {
  const findings: ProMaintenanceFinding[] = []
  const duplicateLearningRecords: string[] = []
  const malformedUrls: string[] = []
  const seen = new Map<string, string>()
  for (const vod of vods) {
    const identity = `${vod.playerId}|${vod.videoUrl}|${[...vod.playerFighterIds].sort().join(',')}`
    const prior = seen.get(identity)
    if (prior) { duplicateLearningRecords.push(vod.id); findings.push({ code: 'duplicate-learning-record', severity: 'error', message: `${vod.id} duplicates ${prior}.`, ids: [prior, vod.id] }) }
    else seen.set(identity, vod.id)
    for (const url of [vod.videoUrl, ...vod.sourceUrls]) if (!safeUrl(url)) malformedUrls.push(`${vod.id}:${url}`)
    if (vod.sourceUrls.length < 2) findings.push({ code: 'thin-provenance', severity: 'warning', message: `${vod.id} has fewer than two provenance URLs.`, ids: [vod.id] })
    if (!isCatalogQuality(vod.quality)) findings.push({ code: 'catalog-quality-below-threshold', severity: 'error', message: `${vod.id} is below the catalog quality threshold.`, ids: [vod.id] })
  }
  if (malformedUrls.length) findings.push({ code: 'malformed-url', severity: 'error', message: `${malformedUrls.length} malformed URL(s) found.`, ids: malformedUrls })
  const temporalByVod = new Map(temporal.map((entry) => [entry.vodId, entry]))
  const staleVodIds = vods.filter((vod) => temporalByVod.get(vod.id)?.era === 'legacy').map((vod) => vod.id)
  if (staleVodIds.length) findings.push({ code: 'legacy-evidence', severity: 'info', message: `${staleVodIds.length} learning record(s) are explicitly legacy.`, ids: staleVodIds })
  const withVods = new Set(vods.flatMap((vod) => vod.playerFighterIds))
  const fightersWithoutCatalogedVods = fighterIds.filter((fighterId) => !withVods.has(fighterId))
  if (fightersWithoutCatalogedVods.length) findings.push({ code: 'fighter-catalog-gap', severity: 'info', message: `${fightersWithoutCatalogedVods.length} fighters need catalog evidence.`, ids: fightersWithoutCatalogedVods })
  return { referenceDate, findings, duplicateLearningRecords, malformedUrls, staleVodIds, fightersWithoutCatalogedVods, externalLinkHealth: 'maintenance-workflow-required' }
}

export interface ProCoverageInputs {
  fighterIds: readonly string[]
  research: readonly ProFighterResearchEntry[]
  players: readonly ProPlayerRepresentative[]
  vods: readonly ProVodRecord[]
  temporal: readonly ProTemporalEvidence[]
  moments: readonly ProDecisionMoment[]
  lessons: readonly ProCharacterLesson[]
  exercises: readonly ProDecisionExercise[]
  matchupPatterns: readonly ProMatchupPattern[]
  comparisons: readonly ProPlayerComparison[]
}

export function buildProRosterCoverage(inputs: ProCoverageInputs): readonly ProFighterCoverage[] {
  const research = new Map(inputs.research.map((entry) => [entry.fighterId, entry]))
  const playerById = new Map(inputs.players.map((player) => [player.id, player]))
  const temporal = new Map(inputs.temporal.map((entry) => [entry.vodId, entry]))
  const lessons = new Map(inputs.lessons.map((lesson) => [lesson.fighterId, lesson]))
  return inputs.fighterIds.map((fighterId) => {
    const representativeIds = research.get(fighterId)?.representativeIds ?? []
    const vods = inputs.vods.filter((vod) => vod.playerFighterIds.includes(fighterId))
    const reviewedMomentCount = inputs.moments.filter((moment) => moment.fighterId === fighterId && isTeachingEligibleMoment(moment)).length
    const lessonClaimCount = lessons.get(fighterId)?.claims.length ?? 0
    const comparison = inputs.comparisons.find((entry) => entry.fighterId === fighterId)
    const state: ProFighterCoverage['state'] = lessonClaimCount > 0 && reviewedMomentCount >= 2 && new Set(vods.map((vod) => vod.id)).size >= 2 ? 'teaching-ready' : reviewedMomentCount > 0 ? 'evidence-building' : vods.length > 0 ? 'cataloged' : representativeIds.length > 0 ? 'representative-seeded' : 'research-queued'
    const notes: string[] = []
    if (!representativeIds.length) notes.push('Representative research remains queued; no player is guessed merely to fill the roster.')
    if (!vods.length) notes.push('No qualifying competitive set is cataloged yet.')
    if (vods.length && !vods.some((vod) => temporal.get(vod.id)?.era === 'current')) notes.push('Cataloged evidence exists, but no set currently falls inside the current-evidence window.')
    if (!reviewedMomentCount) notes.push('No tactical decision moment has passed manual review yet.')
    if (representativeIds.length === 1) notes.push('A second representative is desirable before treating one player style as character-wide.')
    if (!lessonClaimCount) notes.push('No character lesson is promoted until repeated reviewed evidence exists.')
    return {
      fighterId,
      state,
      representativeCount: representativeIds.length,
      activeRepresentativeCount: representativeIds.filter((id) => playerById.get(id)?.status === 'active').length,
      vodCount: vods.length,
      currentVodCount: vods.filter((vod) => temporal.get(vod.id)?.era === 'current').length,
      reviewedMomentCount,
      lessonClaimCount,
      decisionExerciseCount: inputs.exercises.filter((exercise) => exercise.fighterId === fighterId).length,
      matchupPatternCount: inputs.matchupPatterns.filter((pattern) => pattern.fighterId === fighterId).length,
      comparisonReady: comparison?.status === 'ready',
      notes,
    }
  })
}
