import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import type { ProVodRecord } from '../src/data/proLabTypes'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const outputPath = process.argv[2] ?? 'pro-lab-alias-retry.json'
const concurrency = Number(process.env.PRO_LAB_ALIAS_SEARCH_CONCURRENCY ?? 18)
const searchLimit = Number(process.env.PRO_LAB_ALIAS_SEARCH_LIMIT ?? 20)
const cacheDir = process.env.PRO_LAB_ALIAS_CACHE_DIR ?? '.cache/pro-lab-alias-retry'
const ytDlp = process.env.YT_DLP_BIN ?? 'yt-dlp'
const innertubeKey = process.env.PRO_LAB_YT_INNERTUBE_KEY ?? 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const clientVersion = process.env.PRO_LAB_YT_CLIENT_VERSION ?? '2.20260820.01.00'

interface Candidate {
  id: string
  title: string
  channel: string | null
  query: string
}

interface DatedCandidate extends Candidate {
  publishedDate: string | null
}

const normalize = (value: string) => value
  .normalize('NFKC')
  .toLocaleLowerCase('en-US')
  .replace(/&/g, ' and ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

const aliases: Readonly<Record<string, readonly string[]>> = {
  // Source-index aliases observed in the unresolved corpus. Keep this list
  // explicit rather than applying fuzzy edit-distance matching globally.
  'ynn': ['ynn', 'yn'],
  'asimo': ['asimo', 'あしも'],
  'ari': ['ari', 'あり'],
  'raru': ['raru', 'らる'],
  'kaeru': ['kaeru', 'かえる'],
  'karaage': ['karaage', 'からあげ'],
  'tea': ['tea', 'てぃー', 'grn てぃー'],
  'tede': ['tede', 'てで'],
  'shinymark': ['shinymark', 'shiny mark'],
  'maipan': ['maipan', 'まいぱん'],
}

function aliasesFor(value: string) {
  const key = normalize(value)
  return [...new Set([value, ...(aliases[key] ?? [])])]
}

function containsAlias(title: string, values: readonly string[]) {
  const haystack = ` ${normalize(title)} `
  return values.some((value) => {
    const needle = normalize(value)
    return needle.length > 0 && haystack.includes(` ${needle} `)
  })
}

const roundTokens = [
  'grand finals', 'grand final', 'gf',
  'winners finals', 'winners final', 'winner final', 'wf',
  'losers finals', 'losers final', 'loser final', 'lf',
  'winners semis', 'winners semifinals', 'winner semi',
  'losers semis', 'losers semifinals', 'loser semi',
  'winners quarters', 'winners quarterfinals',
  'losers quarters', 'losers quarterfinals',
  'top 8', 'top 12', 'top 16', 'top 24', 'top 32', 'top 48', 'top 64', 'top 96',
  'pools',
]

function stripRoundNoise(value: string) {
  let text = normalize(value)
  for (const token of roundTokens) text = text.replace(new RegExp(`\\b${token.replace(/ /g, '\\s+')}\\b`, 'g'), ' ')
  return text
    .replace(/\b(?:winners?|losers?)\s+round\s+\d+\b/g, ' ')
    .replace(/\b(?:wr|lr)\s*\d+\b/g, ' ')
    .replace(/\b(?:round|r)\s*\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const eventStopwords = new Set(['smash', 'ultimate', 'ssbu', 'tournament', 'singles', 'indexed', 'competitive', 'set', 'source'])

function eventScore(record: ProVodRecord, title: string) {
  const source = stripRoundNoise(record.event)
  const target = normalize(title)
  if (!source) return 0
  if (target.includes(source)) return 1
  const tokens = source.split(' ').filter((token) => token.length >= 2 && !eventStopwords.has(token))
  if (!tokens.length) return 0
  const hits = tokens.filter((token) => target.includes(token)).length
  return hits / tokens.length
}

function roundScore(record: ProVodRecord, title: string) {
  const source = normalize(`${record.event} ${record.round}`)
  const target = normalize(title)
  const patterns: Array<[RegExp, RegExp]> = [
    [/grand finals?|\bgf\b/, /grand finals?|\bgf\b/],
    [/winners? finals?|winner final|\bwf\b/, /winners? finals?|winner final|\bwf\b/],
    [/losers? finals?|loser final|\blf\b/, /losers? finals?|loser final|\blf\b/],
    [/winners? semi(?:finals?)?|winners? semis?/, /winners? semi(?:finals?)?|winners? semis?/],
    [/losers? semi(?:finals?)?|losers? semis?/, /losers? semi(?:finals?)?|losers? semis?/],
    [/winners? quarter(?:finals?)?|winners? quarters?/, /winners? quarter(?:finals?)?|winners? quarters?/],
    [/losers? quarter(?:finals?)?|losers? quarters?/, /losers? quarter(?:finals?)?|losers? quarters?/],
  ]
  for (const [sourcePattern, targetPattern] of patterns) {
    if (sourcePattern.test(source)) return targetPattern.test(target) ? 1 : 0
  }
  const sourceRound = source.match(/\b(?:winners?|losers?)\s+round\s+(\d+)\b/)
  if (sourceRound) return new RegExp(`\\b(?:winners?|losers?)\\s+(?:round\\s+)?${sourceRound[1]}\\b`).test(target) ? 1 : 0
  const sourceTop = source.match(/\btop\s*(\d+)\b/)
  if (sourceTop) return new RegExp(`\\btop\\s*${sourceTop[1]}\\b`).test(target) ? 1 : 0
  return 0.5
}

async function mapConcurrent<T, R>(items: readonly T[], limit: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(Math.max(1, limit), Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const cachePath = (query: string) => join(cacheDir, 'search', `${sha(query)}.json`)

async function readCache<T>(path: string): Promise<T | null> {
  try { return JSON.parse(await readFile(path, 'utf8')) as T } catch { return null }
}

async function writeCache(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8')
}

async function searchYoutube(query: string): Promise<Candidate[]> {
  const path = cachePath(query)
  const cached = await readCache<Candidate[]>(path)
  if (cached) return cached
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(ytDlp, ['--flat-playlist', '--playlist-end', String(searchLimit), '--dump-json', `ytsearch${searchLimit}:${query}`], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { out += chunk })
    child.stderr.on('data', (chunk) => { err += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 || out.trim()) resolve(out)
      else reject(new Error(`yt-dlp search failed (${code}): ${err.slice(-800)}`))
    })
  })
  const items: Candidate[] = []
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue
    try {
      const value = JSON.parse(line) as Record<string, unknown>
      const id = typeof value.id === 'string' ? value.id : ''
      const title = typeof value.title === 'string' ? value.title : ''
      if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title) continue
      items.push({ id, title, channel: typeof value.channel === 'string' ? value.channel : typeof value.uploader === 'string' ? value.uploader : null, query })
    } catch { /* retain valid lines */ }
  }
  await writeCache(path, items)
  return items
}

function findExactDateText(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const stack: unknown[] = [value]
  const exactDate = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/
  while (stack.length) {
    const current = stack.pop()
    if (!current || typeof current !== 'object') continue
    if (Array.isArray(current)) { stack.push(...current); continue }
    const obj = current as Record<string, unknown>
    const dateText = obj.dateText
    if (dateText && typeof dateText === 'object') {
      const simpleText = (dateText as Record<string, unknown>).simpleText
      if (typeof simpleText === 'string' && exactDate.test(simpleText)) return simpleText
    }
    stack.push(...Object.values(obj))
  }
  return null
}

async function fetchPublishedDate(id: string): Promise<string | null> {
  const path = join(cacheDir, 'metadata', `${id}.json`)
  const cached = await readCache<{ publishedDate: string | null }>(path)
  if (cached) return cached.publishedDate
  let publishedDate: string | null = null
  try {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${innertubeKey}&prettyPrint=false`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } }, videoId: id }),
    })
    if (response.ok) {
      const exact = findExactDateText(await response.json())
      if (exact) {
        const timestamp = Date.parse(`${exact} 12:00:00 UTC`)
        if (Number.isFinite(timestamp)) publishedDate = new Date(timestamp).toISOString().slice(0, 10)
      }
    }
  } catch { /* date remains optional */ }
  await writeCache(path, { publishedDate })
  return publishedDate
}

const reps = new Map(proPlayerRepresentatives.map((rep) => [rep.id, rep.tag]))
const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')

interface Job { vodId: string; query: string }
const jobs: Job[] = []
const recordAliases = new Map<string, { player: string[]; opponent: string[] }>()
for (const record of unresolved) {
  const playerTag = reps.get(record.playerId) ?? record.title.split('—').at(-1)?.split('vs.')[0]?.trim() ?? record.playerId
  const player = aliasesFor(playerTag)
  const opponent = aliasesFor(record.opponentTag)
  recordAliases.set(record.id, { player, opponent })
  const queries = new Set<string>([
    record.title,
    `${record.event} ${playerTag} ${record.opponentTag}`,
    `${playerTag} vs ${record.opponentTag} ${record.date.slice(0, 4)} Smash Ultimate`,
  ])
  for (const p of player.slice(0, 3)) for (const o of opponent.slice(0, 3)) {
    queries.add(`${record.event} ${p} ${o}`)
    queries.add(`${p} vs ${o} ${record.date.slice(0, 4)} Smash Ultimate`)
  }
  for (const query of queries) if (query.trim()) jobs.push({ vodId: record.id, query: query.trim() })
}

console.log(`UNRESOLVED_INPUT=${unresolved.length}`)
console.log(`SEARCH_JOBS=${jobs.length}`)
console.log(`SEARCH_CONCURRENCY=${concurrency}`)

const errors: Array<{ vodId: string; query: string; error: string }> = []
const results = await mapConcurrent(jobs, concurrency, async (job, index) => {
  try {
    const candidates = await searchYoutube(job.query)
    if ((index + 1) % 100 === 0) console.log(`SEARCH_PROGRESS=${index + 1}/${jobs.length}`)
    return { ...job, candidates }
  } catch (error) {
    errors.push({ ...job, error: error instanceof Error ? error.message : String(error) })
    return { ...job, candidates: [] as Candidate[] }
  }
})

const byVod = new Map<string, Map<string, Candidate>>()
for (const result of results) {
  const alias = recordAliases.get(result.vodId)
  if (!alias) continue
  const map = byVod.get(result.vodId) ?? new Map<string, Candidate>()
  for (const candidate of result.candidates) {
    if (!containsAlias(candidate.title, alias.player) || !containsAlias(candidate.title, alias.opponent)) continue
    if (!map.has(candidate.id)) map.set(candidate.id, candidate)
  }
  byVod.set(result.vodId, map)
}

const uniqueIds = [...new Set([...byVod.values()].flatMap((map) => [...map.keys()]))]
const datePairs = await mapConcurrent(uniqueIds, 24, async (id, index) => {
  const publishedDate = await fetchPublishedDate(id)
  if ((index + 1) % 100 === 0) console.log(`METADATA_PROGRESS=${index + 1}/${uniqueIds.length}`)
  return [id, publishedDate] as const
})
const dateById = new Map(datePairs)

const records = unresolved.map((record) => {
  const candidates: DatedCandidate[] = [...(byVod.get(record.id)?.values() ?? [])].map((candidate) => ({ ...candidate, publishedDate: dateById.get(candidate.id) ?? null }))
  const scored = candidates.map((candidate) => ({
    ...candidate,
    eventScore: eventScore(record, candidate.title),
    roundScore: roundScore(record, candidate.title),
    sameYear: candidate.publishedDate?.slice(0, 4) === record.date.slice(0, 4),
  })).sort((a, b) => (b.eventScore + b.roundScore) - (a.eventScore + a.roundScore))
  const strong = scored.filter((candidate) => candidate.eventScore >= 0.6 && candidate.roundScore >= 0.5 && (candidate.sameYear || candidate.publishedDate === null))
  return {
    vodId: record.id,
    title: record.title,
    event: record.event,
    sourceDate: record.date,
    playerId: record.playerId,
    opponentTag: record.opponentTag,
    candidateCount: scored.length,
    strongCount: strong.length,
    suggested: strong.length === 1 ? strong[0] : null,
    candidates: scored.slice(0, 12),
  }
})

const suggested = records.filter((record) => record.suggested !== null)
const noCandidate = records.filter((record) => record.candidateCount === 0)
const ambiguous = records.filter((record) => record.candidateCount > 0 && record.suggested === null)
const report = {
  unresolvedInput: unresolved.length,
  searchJobs: jobs.length,
  pairCandidateVideos: uniqueIds.length,
  suggestedCount: suggested.length,
  noCandidateCount: noCandidate.length,
  ambiguousCount: ambiguous.length,
  searchErrors: errors.length,
  suggestions: suggested,
  noCandidate: noCandidate.map((record) => record.vodId),
  ambiguous,
  errors,
}
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`PAIR_CANDIDATE_VIDEOS=${uniqueIds.length}`)
console.log(`SUGGESTED=${suggested.length}`)
console.log(`NO_CANDIDATE=${noCandidate.length}`)
console.log(`AMBIGUOUS=${ambiguous.length}`)
console.log(`SEARCH_ERRORS=${errors.length}`)
console.log(`OUTPUT=${outputPath}`)
