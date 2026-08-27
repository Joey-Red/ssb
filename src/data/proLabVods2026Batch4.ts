import { proVodCatalog2026Comicpalooza } from './proLabVods2026Comicpalooza'
import { proVodCatalog2026Patchwork } from './proLabVods2026Patchwork'
import { proVodCatalog2026SFactor } from './proLabVods2026SFactor'
import { proVodCatalog2026Supernova } from './proLabVods2026Supernova'
import type { ProVodRecord } from './proLabTypes'

export const proVodCatalog2026Batch4 = [
  ...proVodCatalog2026Patchwork,
  ...proVodCatalog2026SFactor,
  ...proVodCatalog2026Comicpalooza,
  ...proVodCatalog2026Supernova,
] as readonly ProVodRecord[]

export {
  proVodCatalog2026Comicpalooza,
  proVodCatalog2026Patchwork,
  proVodCatalog2026SFactor,
  proVodCatalog2026Supernova,
}
