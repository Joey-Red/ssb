import { writeFile } from 'node:fs/promises'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const output = process.argv[2] ?? 'pro-lab-unresolved.json'
const records = proVodCatalog
  .filter((vod) => vod.linkKind === 'source-index')
  .map((vod) => ({
    id: vod.id,
    title: vod.title,
    event: vod.event,
    round: vod.round,
    date: vod.date,
    datePrecision: vod.datePrecision,
    eventTier: vod.eventTier,
    playerId: vod.playerId,
    playerFighterIds: vod.playerFighterIds,
    opponentTag: vod.opponentTag,
    opponentFighterIds: vod.opponentFighterIds,
    sourceUrls: vod.sourceUrls,
    notes: vod.notes,
  }))
await writeFile(output, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
console.log(`UNRESOLVED=${records.length}`)
