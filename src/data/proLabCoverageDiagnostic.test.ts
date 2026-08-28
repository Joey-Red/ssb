import { describe, it } from 'vitest'
import { proCoverageDistributionAudit, proCoverageWorkQueue } from './proLab'

describe('temporary Pro Lab milestone coverage diagnostic', () => {
  it('reports the live roster-wide coverage queue for M73 planning', () => {
    const severe = proCoverageWorkQueue
      .filter((item) => item.vodCount < 6)
      .map((item) => ({
        fighterId: item.fighterId,
        vodCount: item.vodCount,
        currentVodCount: item.currentVodCount,
        representativeCount: item.representativeCount,
      }))
    throw new Error(`PROLAB_M73_AUDIT ${JSON.stringify({ summary: proCoverageDistributionAudit, severe })}`)
  })
})
