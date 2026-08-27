import { roster } from './roster'
import { proLabPilotFighterIds, proPlayerRepresentatives as foundationalRepresentatives } from './proLabRoster'
import { proPlayerRepresentatives2026Batch2 } from './proLabRoster2026Batch2'
import { proPlayerRepresentatives2026Batch3 } from './proLabRoster2026Batch3'
import { proPlayerRepresentatives2026Batch4 } from './proLabRoster2026Batch4'
import { proPlayerRepresentatives2026Batch5 } from './proLabRoster2026Batch5'
import { proMetaGapRepresentatives } from './proLabRosterMetaGaps'
import { supplementalProPlayerRepresentatives } from './proLabRosterSupplemental'
import type { ProFighterResearchEntry, ProPlayerRepresentative } from './proLabTypes'

export const proPlayerRepresentatives = [
  ...foundationalRepresentatives,
  ...supplementalProPlayerRepresentatives,
  ...proMetaGapRepresentatives,
  ...proPlayerRepresentatives2026Batch2,
  ...proPlayerRepresentatives2026Batch3,
  ...proPlayerRepresentatives2026Batch4,
  ...proPlayerRepresentatives2026Batch5,
] as readonly ProPlayerRepresentative[]

const representativesForFighter = (fighterId: string) =>
  proPlayerRepresentatives
    .filter((player) => player.characterRoles.some((role) => role.fighterId === fighterId))
    .map((player) => player.id)

export const proFighterResearchRegistry: readonly ProFighterResearchEntry[] = roster.map((fighter) => {
  const representativeIds = representativesForFighter(fighter.id)
  return {
    fighterId: fighter.id,
    status: representativeIds.length > 0 ? 'seeded' : 'research-queued',
    representativeIds,
    researchNotes:
      representativeIds.length > 0
        ? ['Representative candidates are provenance-backed; VOD-level character usage must still be confirmed per set.']
        : ['Representative selection remains queued rather than guessed; sparse characters should be researched from current ranking and tournament evidence.'],
  }
})

export {
  proLabPilotFighterIds,
  proMetaGapRepresentatives,
  proPlayerRepresentatives2026Batch2,
  proPlayerRepresentatives2026Batch3,
  proPlayerRepresentatives2026Batch4,
  proPlayerRepresentatives2026Batch5,
  supplementalProPlayerRepresentatives,
}
