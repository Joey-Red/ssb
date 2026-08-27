import { proVodCatalogHistoricalBatch6A } from './proLabVodsHistoricalBatch6A'
import { proVodCatalogHistoricalBatch6B } from './proLabVodsHistoricalBatch6B'
import { proVodCatalogHistoricalBatch6C } from './proLabVodsHistoricalBatch6C'
import type { ProVodRecord } from './proLabTypes'

export const proVodCatalogHistoricalBatch6 = [
  ...proVodCatalogHistoricalBatch6A,
  ...proVodCatalogHistoricalBatch6B,
  ...proVodCatalogHistoricalBatch6C,
] as readonly ProVodRecord[]

export {
  proVodCatalogHistoricalBatch6A,
  proVodCatalogHistoricalBatch6B,
  proVodCatalogHistoricalBatch6C,
}
