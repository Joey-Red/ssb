import type { FighterGuide, FighterManifestEntry, SourceRef } from '../types'

const expectedPercentages = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200] as const

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
    for (const frame of guide.keyFrames) {
      if (!Number.isInteger(frame.startup) || frame.startup <= 0) errors.push(`${guide.fighterId}/${frame.move} has invalid startup`)
      if (!sourceIds.has(frame.sourceId)) errors.push(`${guide.fighterId}/${frame.move} references missing source ${frame.sourceId}`)
    }
  }

  for (const fighter of roster) if (!guideIds.has(fighter.id)) errors.push(`Roster fighter is missing a guide: ${fighter.id}`)
  return errors
}

export function assertNoValidationErrors(errors: readonly string[]): void {
  if (errors.length > 0) throw new Error(`Static data validation failed:\n- ${errors.join('\n- ')}`)
}
