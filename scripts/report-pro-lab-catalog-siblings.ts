import { writeFile } from 'node:fs/promises'
import type { ProVodRecord } from '../src/data/proLabTypes'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const outputPath = process.argv[2] ?? 'pro-lab-catalog-sibling-resolutions.json'

const normalizeWords = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('en-US')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const roundClass = (value: string): string | null => {
  const text = ` ${normalizeWords(value)} `
  const checks: Array<[RegExp, string]> = [
    [/\b(?:grand finals?|gf)\b/, 'grand-finals'],
    [/\b(?:winners? finals?|winner finals?|wf)\b/, 'winners-finals'],
    [/\b(?:losers? finals?|loser finals?|lf)\b/, 'losers-finals'],
    [/\b(?:winners? semi(?:finals?)?|winners? semis?|winner semi(?:finals?)?)\b/, 'winners-semis'],
    [/\b(?:losers? semi(?:finals?)?|losers? semis?|loser semi(?:finals?)?)\b/, 'losers-semis'],
    [/\b(?:winners? quarter(?:finals?)?|winners? quarters?)\b/, 'winners-quarters'],
    [/\b(?:losers? quarter(?:finals?)?|losers? quarters?)\b/, 'losers-quarters'],
  ]
  for (const [pattern, label] of checks) if (pattern.test(text)) return label
  const winnersRound = text.match(/\bwinners? round (\d+)\b/)
  if (winnersRound) return `winners-round-${winnersRound[1]}`
  const losersRound = text.match(/\blosers? round (\d+)\b/)
  if (losersRound) return `losers-round-${losersRound[1]}`
  const top = text.match(/\btop ?(\d+)\b/)
  if (top) return `top-${top[1]}`
  if (/\bpools?\b/.test(text)) return 'pools'
  return null
}

const eventBase = (value: string) => normalizeWords(value)
  .replace(/\bgrand finals?\b/g, ' ')
  .replace(/\bwinners? finals?\b/g, ' ')
  .replace(/\blosers? finals?\b/g, ' ')
  .replace(/\bwinners? semi(?:finals?)?\b/g, ' ')
  .replace(/\blosers? semi(?:finals?)?\b/g, ' ')
  .replace(/\bwinners? semis?\b/g, ' ')
  .replace(/\blosers? semis?\b/g, ' ')
  .replace(/\bwinners? quarter(?:finals?)?\b/g, ' ')
  .replace(/\blosers? quarter(?:finals?)?\b/g, ' ')
  .replace(/\bwinners? quarters?\b/g, ' ')
  .replace(/\blosers? quarters?\b/g, ' ')
  .replace(/\bwinners? round \d+\b/g, ' ')
  .replace(/\blosers? round \d+\b/g, ' ')
  .replace(/\btop ?\d+\b/g, ' ')
  .replace(/\bpools?\b/g, ' ')
  .replace(/\bultimate singles\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const identity = (vod: ProVodRecord, includeRound: boolean) => [
  vod.playerId,
  normalizeWords(vod.opponentTag),
  eventBase(vod.event),
  vod.date,
  includeRound ? (roundClass(`${vod.event} ${vod.round}`) ?? normalizeWords(vod.round)) : '',
].join('|')

const direct = proVodCatalog.filter((vod) => vod.linkKind === 'direct-video' && vod.videoProvider === 'youtube' && vod.videoId)
const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')
const exact = new Map<string, Set<string>>()
const broad = new Map<string, Set<string>>()
for (const vod of direct) {
  if (!vod.videoId) continue
  for (const [key, map] of [[identity(vod, true), exact], [identity(vod, false), broad]] as const) {
    const ids = map.get(key) ?? new Set<string>()
    ids.add(vod.videoId)
    map.set(key, ids)
  }
}

const resolutions: Record<string, string> = {}
const evidence: Array<Record<string, unknown>> = []
const ambiguous: Array<Record<string, unknown>> = []
for (const vod of unresolved) {
  const exactIds = [...(exact.get(identity(vod, true)) ?? [])]
  if (exactIds.length === 1) {
    resolutions[vod.id] = exactIds[0]
    evidence.push({ vodId: vod.id, youtubeId: exactIds[0], method: 'exact-event-date-pair-round', event: vod.event, round: vod.round })
    continue
  }
  const broadIds = [...(broad.get(identity(vod, false)) ?? [])]
  if (broadIds.length === 1) {
    resolutions[vod.id] = broadIds[0]
    evidence.push({ vodId: vod.id, youtubeId: broadIds[0], method: 'unique-event-date-pair', event: vod.event, round: vod.round })
  } else if (exactIds.length > 1 || broadIds.length > 1) {
    ambiguous.push({ vodId: vod.id, exactIds, broadIds })
  }
}

const report = {
  unresolvedInput: unresolved.length,
  directInput: direct.length,
  resolvedCount: Object.keys(resolutions).length,
  projectedUnresolvedAfter: unresolved.length - Object.keys(resolutions).length,
  ambiguousCount: ambiguous.length,
  evidence,
  ambiguous,
  resolutions,
}
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ unresolvedInput: report.unresolvedInput, resolvedCount: report.resolvedCount, projectedUnresolvedAfter: report.projectedUnresolvedAfter, ambiguousCount: report.ambiguousCount }))