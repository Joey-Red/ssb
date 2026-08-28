import { describe, expect, it } from 'vitest'
import { proCoverageDistributionAudit, proCoverageWorkQueue } from './proLab'

describe('temporary Pro Lab milestone coverage diagnostic', () => {
  it('prints the live roster-wide coverage queue for M73 planning', () => {
    const severe = proCoverageWorkQueue.filter((item) => item.vodCount < 6)
    console.log('PROLAB_M73_AUDIT', JSON.stringify({
      summary: proCoverageDistributionAudit,
      severe,
      all: proCoverageWorkQueue.map((item) => ({
        fighterId: item.fighterId,
        vodCount: item.vodCount,
        currentVodCount: item.currentVodCount,
        representativeCount: item.representativeCount,
        vodGap: item.vodGap,
        currentVodGap: item.currentVodGap,
        representativeGap: item.representativeGap,
      })),
    }))
    expect(proCoverageWorkQueue).toHaveLength(89)
  })
})
