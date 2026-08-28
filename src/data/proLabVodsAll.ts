import { applyProVodLinkResolution2026Batch5 } from './proLabVodLinkResolutions2026Batch5'
import { applyProVodLinkResolutionBulk1 } from './proLabVodLinkResolutionsBulk1'
import { applyProVodLinkResolutionBulk2 } from './proLabVodLinkResolutionsBulk2'
import { applyProVodLinkResolutionBulk3 } from './proLabVodLinkResolutionsBulk3'
import { applyProVodLinkResolutionBulk4 } from './proLabVodLinkResolutionsBulk4'
import { applyProVodLinkResolutionBulk5 } from './proLabVodLinkResolutionsBulk5'
import { applyProVodLinkResolutionBulk6 } from './proLabVodLinkResolutionsBulk6'
import { applyProVodLinkResolutionBulk7 } from './proLabVodLinkResolutionsBulk7'
import { applyProVodLinkResolutionBulk8 } from './proLabVodLinkResolutionsBulk8'
import { applyProVodLinkResolutionBulk9 } from './proLabVodLinkResolutionsBulk9'
import { applyProVodLinkResolutionBulk10 } from './proLabVodLinkResolutionsBulk10'
import { applyProVodLinkResolutionBulk11 } from './proLabVodLinkResolutionsBulk11'
import { proVodCatalog2026Batch1 } from './proLabVods2026Batch1'
import { proVodCatalog2026Batch2 } from './proLabVods2026Batch2'
import { proVodCatalog2026Batch3 } from './proLabVods2026Batch3'
import { proVodCatalog2026Batch4 } from './proLabVods2026Batch4'
import { proVodCatalog2026Batch5 } from './proLabVods2026Batch5'
import { proCoverageGapVodCatalog } from './proLabVodsCoverageGaps'
import {
  proVodFinal293Candidates,
  selectProVodAcquisitionBatch,
} from './proLabVodsFinal293'
import { proVodCatalogHistoricalBatch6 } from './proLabVodsHistoricalBatch6'
import { supplementalProVodCatalog } from './proLabVodsSupplemental'
import { proVodCatalog as foundationalProVodCatalog } from './proLabVods'
import type { ProVodRecord } from './proLabTypes'

export const proVodCatalogBeforeFinal293 = [
  ...foundationalProVodCatalog,
  ...supplementalProVodCatalog,
  ...proVodCatalog2026Batch1,
  ...proVodCatalog2026Batch2,
  ...proVodCatalog2026Batch3,
  ...proVodCatalog2026Batch4,
  ...proVodCatalog2026Batch5,
  ...proVodCatalogHistoricalBatch6,
] as readonly ProVodRecord[]

export const proVodCatalogFinal293 = selectProVodAcquisitionBatch(
  proVodCatalogBeforeFinal293,
  proVodFinal293Candidates,
  293,
)

const unresolvedAcquisitionCatalog = [
  ...proVodCatalogBeforeFinal293,
  ...proVodCatalogFinal293,
] as readonly ProVodRecord[]

/**
 * Immutable 800-record acquisition/recovery baseline. Historical recovery tests
 * intentionally target this catalog so later roster coverage work can grow the
 * live corpus without rewriting what those completed batches accomplished.
 */
export const proVodCatalog = unresolvedAcquisitionCatalog.map((vod) =>
  applyProVodLinkResolutionBulk11(
    applyProVodLinkResolutionBulk10(
      applyProVodLinkResolutionBulk9(
        applyProVodLinkResolutionBulk8(
          applyProVodLinkResolutionBulk7(
            applyProVodLinkResolutionBulk6(
              applyProVodLinkResolutionBulk5(
                applyProVodLinkResolutionBulk4(
                  applyProVodLinkResolutionBulk3(
                    applyProVodLinkResolutionBulk2(
                      applyProVodLinkResolutionBulk1(applyProVodLinkResolution2026Batch5(vod)),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
) as readonly ProVodRecord[]

/** Live Pro Lab corpus: completed 800-set baseline plus neutral coverage gaps. */
export const proVodCatalogWithCoverageGaps = [
  ...proVodCatalog,
  ...proCoverageGapVodCatalog,
] as readonly ProVodRecord[]

export const proVodById = new Map(proVodCatalogWithCoverageGaps.map((vod) => [vod.id, vod]))

export function vodIncludesFighter(vod: ProVodRecord, fighterId: string) {
  return vod.playerFighterIds.includes(fighterId) || vod.opponentFighterIds.includes(fighterId)
}

export function getProVodsForFighter(fighterId: string) {
  return proVodCatalogWithCoverageGaps.filter((vod) => vodIncludesFighter(vod, fighterId))
}

export function getProVodsForPlayer(playerId: string) {
  return proVodCatalogWithCoverageGaps.filter((vod) => vod.playerId === playerId)
}

export {
  proCoverageGapVodCatalog,
  proVodCatalog2026Batch1,
  proVodCatalog2026Batch2,
  proVodCatalog2026Batch3,
  proVodCatalog2026Batch4,
  proVodCatalog2026Batch5,
  proVodCatalogHistoricalBatch6,
  proVodFinal293Candidates,
  supplementalProVodCatalog,
}
