import { roster } from './roster'
import { proLabPilotFighterIds, proPlayerRepresentatives as foundationalRepresentatives } from './proLabRoster'
import { proMetaGapRepresentatives } from './proLabRosterMetaGaps'
import { supplementalProPlayerRepresentatives } from './proLabRosterSupplemental'
import type { ProFighterResearchEntry, ProPlayerRepresentative } from './proLabTypes'

export const proPlayerRepresentatives = [
  ...foundationalRepresentatives,
  ...supplementalProPlayerRepresentatives,
  ...proMetaGapRepresentatives,
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

export { proLabPilotFighterIds, proMetaGapRepresentatives, supplementalProPlayerRepresentatives }
