import type { FighterGuide, FighterManifestEntry, FrameDataSnapshot, MoveCategory, SourceRef } from '../types'

const expectedPercentages = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200] as const
const frameCategories = new Set<MoveCategory>(['ground', 'aerial', 'special', 'grab', 'defense', 'misc'])

export function validateRoster(roster: readonly FighterManifestEntry[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const slugs = new Set<string>()

  if (roster.length !== 89) errors.push(`Expected 89 independent fighter pages, found ${roster.length}`)

  for (const fighter of roster) {
    if (ids.has(fighter.id)) errors.push(`Duplicate fighter id: ${fighter.id}`)
    if (slugs.has(fighter.slug)) errors.push(`Duplicate fighter slug: ${fighter.slug}`)
    if (!/^[a-z0-9-]+$/.test(fighter.slug)) errors.push(`Invalid fighter slug: ${fighter.slug}`)
    ids.add(fighter.id)
    slugs.add(fighter.slug)
  }
  return errors
}

export function validateGuides(guides: readonly FighterGuide[], roster: readonly FighterManifestEntry[], sources: readonly SourceRef[]): string[] {
  const errors: string[] = []
  const rosterIds = new Set(roster.map((fighter) => fighter.id))
  const sourceIds = new Set<string>()
  const guideIds = new Set<string>()

  for (const source of sources) {
    if (sourceIds.has(source.id)) errors.push(`Duplicate source id: ${source.id}`)
    sourceIds.add(source.id)
    if (!source.url.startsWith('https://')) errors.push(`Source ${source.id} must use HTTPS`)
  }

  if (guides.length !== roster.length) errors.push(`Expected ${roster.length} fighter guides, found ${guides.length}`)

  for (const guide of guides) {
    if (!rosterIds.has(guide.fighterId)) errors.push(`Guide has unknown fighter: ${guide.fighterId}`)
    if (guideIds.has(guide.fighterId)) errors.push(`Duplicate guide: ${guide.fighterId}`)
    guideIds.add(guide.fighterId)

    if (!guide.memoryAid.trim()) errors.push(`${guide.fighterId} is missing a memory aid`)
    if (guide.quickGuide.length < 3) errors.push(`${guide.fighterId} needs at least three quick-guide notes`)
    if (guide.combos.length < 2) errors.push(`${guide.fighterId} needs at least two combo/confirm/practice routes`)
    if (guide.sourceIds.length === 0) errors.push(`${guide.fighterId} needs source metadata`)

    const routinePercentages = guide.trainingRoutine.map((step) => step.percent)
    if (routinePercentages.length !== expectedPercentages.length) {
      errors.push(`${guide.fighterId} must contain exactly 0–200 routine steps in 20% increments`)
    } else {
      expectedPercentages.forEach((percent, index) => {
        if (routinePercentages[index] !== percent) errors.push(`${guide.fighterId} routine expected ${percent}% at position ${index}`)
      })
    }

    for (const step of guide.trainingRoutine) {
      if (step.route.length === 0) errors.push(`${guide.fighterId}/${step.percent}% has an empty training route`)
      if (!step.purpose.trim()) errors.push(`${guide.fighterId}/${step.percent}% is missing its practice purpose`)
    }

    const comboIds = new Set<string>()
    for (const combo of guide.combos) {
      if (comboIds.has(combo.id)) errors.push(`${guide.fighterId} has duplicate combo id ${combo.id}`)
      comboIds.add(combo.id)
      if (combo.minPercent < 0 || combo.maxPercent > 999 || combo.maxPercent < combo.minPercent) errors.push(`${guide.fighterId}/${combo.id} has invalid percentage window`)
      if (combo.route.length < 2) errors.push(`${guide.fighterId}/${combo.id} must have at least two actions`)
      if (combo.kind === 'true' && combo.confidence !== 'verified') errors.push(`${guide.fighterId}/${combo.id} cannot be labeled true without verified confidence`)
      if (combo.kind === 'true' && (!combo.conditions || combo.conditions.length === 0)) errors.push(`${guide.fighterId}/${combo.id} true combo must document its conditions`)
      for (const sourceId of combo.sourceIds) if (!sourceIds.has(sourceId)) errors.push(`${guide.fighterId}/${combo.id} references missing source ${sourceId}`)
    }

    for (const sourceId of guide.sourceIds) if (!sourceIds.has(sourceId)) errors.push(`${guide.fighterId} references missing source ${sourceId}`)
    if (guide.progression) {
      if (!sourceIds.has(guide.progression.sourceId)) errors.push(`${guide.fighterId} progression references missing source ${guide.progression.sourceId}`)
      if (!guide.sourceIds.includes(guide.progression.sourceId)) errors.push(`${guide.fighterId} progression source must also appear in guide sources`)

      const techniqueIds = new Set<string>()
      const progressionTiers = new Set(guide.progression.techniques.map((technique) => technique.tier))
      for (const tier of ['beginner', 'intermediate', 'pro', 'godlike'] as const) {
        if (!progressionTiers.has(tier)) errors.push(`${guide.fighterId} progression is missing ${tier} techniques`)
      }

      for (const technique of guide.progression.techniques) {
        if (techniqueIds.has(technique.id)) errors.push(`${guide.fighterId} has duplicate progression technique ${technique.id}`)
        techniqueIds.add(technique.id)
        if (!/^[a-z0-9-]+$/.test(technique.id)) errors.push(`${guide.fighterId}/${technique.id} has an invalid progression id`)
        if (technique.route.length < 2) errors.push(`${guide.fighterId}/${technique.id} must document at least two route actions`)
        if (!Number.isInteger(technique.timestampSeconds) || technique.timestampSeconds < 0) errors.push(`${guide.fighterId}/${technique.id} has an invalid video timestamp`)
        if (technique.verdict === 'source-true' && (!technique.caveats || technique.caveats.length === 0)) errors.push(`${guide.fighterId}/${technique.id} source-true route must retain a qualification`)
      }
    }
    for (const frame of guide.keyFrames) {
      if (!Number.isInteger(frame.startup) || frame.startup <= 0) errors.push(`${guide.fighterId}/${frame.move} has invalid startup`)
      if (!sourceIds.has(frame.sourceId)) errors.push(`${guide.fighterId}/${frame.move} references missing source ${frame.sourceId}`)
    }
  }

  for (const fighter of roster) if (!guideIds.has(fighter.id)) errors.push(`Roster fighter is missing a guide: ${fighter.id}`)
  return errors
}

export function validateFrameData(snapshot: FrameDataSnapshot, roster: readonly FighterManifestEntry[]): string[] {
  const errors: string[] = []
  const rosterIds = new Set(roster.map((fighter) => fighter.id))
  const frameIds = new Set(Object.keys(snapshot.fighters))

  if (snapshot.version !== 1) errors.push(`Unsupported frame-data snapshot version: ${snapshot.version}`)
  if (snapshot.source.id !== 'ultimate-frame-data') errors.push(`Unexpected frame-data source id: ${snapshot.source.id}`)
  if (!snapshot.source.baseUrl.startsWith('https://')) errors.push('Frame-data base URL must use HTTPS')
  if (Number.isNaN(Date.parse(snapshot.generatedAt))) errors.push('Frame-data generatedAt is not a valid timestamp')
  if (frameIds.size !== rosterIds.size) errors.push(`Expected frame data for ${rosterIds.size} fighters, found ${frameIds.size}`)

  for (const fighterId of rosterIds) if (!frameIds.has(fighterId)) errors.push(`Missing frame data: ${fighterId}`)
  for (const fighterId of frameIds) if (!rosterIds.has(fighterId)) errors.push(`Unknown frame-data fighter: ${fighterId}`)

  for (const [fighterId, data] of Object.entries(snapshot.fighters)) {
    if (data.fighterId !== fighterId) errors.push(`${fighterId} frame-data key/id mismatch`)
    if (!data.name.trim()) errors.push(`${fighterId} frame data is missing a display name`)
    if (!data.sourceUrl.startsWith('https://ultimateframedata.com/')) errors.push(`${fighterId} frame-data source URL must point to Ultimate Frame Data`)
    if (data.moves.length < 12) errors.push(`${fighterId} has too few frame-data rows: ${data.moves.length}`)

    const moveIds = new Set<string>()
    for (const move of data.moves) {
      if (moveIds.has(move.id)) errors.push(`${fighterId} has duplicate frame move id: ${move.id}`)
      moveIds.add(move.id)
      if (!move.name.trim()) errors.push(`${fighterId}/${move.id} is missing a move name`)
      if (!frameCategories.has(move.category)) errors.push(`${fighterId}/${move.id} has invalid category ${move.category}`)
      if (move.startupFrame !== null && (!Number.isInteger(move.startupFrame) || move.startupFrame <= 0)) errors.push(`${fighterId}/${move.id} has invalid parsed startup frame`)
      if (move.startup && move.startupFrame !== null) {
        const rawFirst = Number(move.startup.match(/\d+/)?.[0])
        if (Number.isFinite(rawFirst) && rawFirst !== move.startupFrame) errors.push(`${fighterId}/${move.id} startupFrame does not match raw startup notation`)
      }
    }
  }
  return errors
}

export function assertNoValidationErrors(errors: readonly string[]): void {
  if (errors.length > 0) throw new Error(`Static data validation failed:\n- ${errors.join('\n- ')}`)
}
