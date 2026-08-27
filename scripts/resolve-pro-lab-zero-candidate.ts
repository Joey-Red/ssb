import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const outputPath = process.argv[2] ?? 'pro-lab-zero-candidate.json'
const concurrency = Number(process.env.PRO_LAB_ZERO_SEARCH_CONCURRENCY ?? 18)
const searchLimit = Number(process.env.PRO_LAB_ZERO_SEARCH_LIMIT ?? 40)
const cacheDir = process.env.PRO_LAB_ZERO_CACHE_DIR ?? '.cache/pro-lab-alias-retry'
const ytDlp = process.env.YT_DLP_BIN ?? 'yt-dlp'
const innertubeKey = process.env.PRO_LAB_YT_INNERTUBE_KEY ?? 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const clientVersion = process.env.PRO_LAB_YT_CLIENT_VERSION ?? '2.20260820.01.00'

const targetIds = new Set([
  'patchwork26-11', 'patchwork26-21', 'patchwork26-22', 'patchwork26-23', 'bobc8-14',
  'hist6-041', 'hist6-045', 'hist6-077', 'hist6-143', 'hist6-300',
  'final293-a-010', 'final293-a-035', 'final293-a-038', 'final293-a-039', 'final293-a-043', 'final293-a-044', 'final293-a-046', 'final293-a-052', 'final293-a-055',
  'final293-b-113', 'final293-b-114', 'final293-b-120', 'final293-b-121', 'final293-b-122', 'final293-b-123', 'final293-b-124', 'final293-b-126', 'final293-b-128',
  'final293-c-001', 'final293-c-003', 'final293-c-005', 'final293-c-007', 'final293-c-009', 'final293-c-105',
  'final293-d-004', 'final293-d-005',
])

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const aliases: Readonly<Record<string, readonly string[]>> = {
  'ploopy xcx': ['Ploopy xcx', 'Ploopy'],
  'ynn': ['Ynn', 'Yn'],
  'sparg0': ['Sparg0', 'Spargo'],
  'asimo': ['Asimo', 'あしも'],
  'ari': ['Ari', 'あり'],
  'raru': ['Raru', 'らる'],
  'koa': ['koa', 'Koa', 'こあ'],
  'naocha': ['Naocha', 'なおちゃ'],
  'karaage': ['Karaage', 'からあげ'],
  'diegorou': ['DieGorou', 'Diegorou', 'Dieごろう'],
  'tea': ['Tea', 'てぃー', 'GRN てぃー'],
  'light': ['Light', 'ライト'],
  'kaninabe': ['Kaninabe', 'かになべ'],
  'shuton': ['Shuton', 'しゅーとん'],
  'umeki': ['Umeki', 'うめき'],
  'doramigi': ['Doramigi', 'ドラ右'],
  'raki': ['Raki', 'らき'],
  'miya': ['Miya', 'ミーヤー'],
  'acola': ['Acola', 'あcola', 'あこーら'],
  'zackray': ['Zackray', 'ザクレイ'],
  'mkleo': ['MkLeo', 'MKLeo', 'Leo'],
  'lui': ['Lui$', 'Lui'],
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

async function mapConcurrent<T, R>(items: readonly T[], limit: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  }))
  return results
}

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const cachePath = (query: string) => join(cacheDir, 'search', `${sha(query)}.json`)
async function readCache<T>(path: string): Promise<T | null> { try { return JSON.parse(await readFile(path, 'utf8')) as T } catch { return null } }
async function writeCache(path: string, value: unknown) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8') }

interface Candidate { id: string; title: string; channel: string | null; query: string }
async function searchYoutube(query: string): Promise<Candidate[]> {
  const path = cachePath(query)
  const cached = await readCache<Candidate[]>(path)
  if (cached) return cached
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(ytDlp, ['--flat-playlist', '--playlist-end', String(searchLimit), '--dump-json', `ytsearch${searchLimit}:${query}`], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''; let err = ''
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { out += chunk }); child.stderr.on('data', (chunk) => { err += chunk })
    child.on('error', reject); child.on('close', (code) => code === 0 || out.trim() ? resolve(out) : reject(new Error(`yt-dlp search failed (${code}): ${err.slice(-500)}`)))
  })
  const items: Candidate[] = []
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue
    try {
      const value = JSON.parse(line) as Record<string, unknown>
      const id = typeof value.id === 'string' ? value.id : ''
      const title = typeof value.title === 'string' ? value.title : ''
      if (/^[A-Za-z0-9_-]{11}$/.test(id) && title) items.push({ id, title, channel: typeof value.channel === 'string' ? value.channel : null, query })
    } catch { /* keep valid lines */ }
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

async function publishedDate(id: string) {
  const path = join(cacheDir, 'metadata', `${id}.json`)
  const cached = await readCache<{ publishedDate: string | null }>(path)
  if (cached) return cached.publishedDate
  let result: string | null = null
  try {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${innertubeKey}&prettyPrint=false`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } }, videoId: id }),
    })
    if (response.ok) {
      const exact = findExactDateText(await response.json())
      if (exact) { const ms = Date.parse(`${exact} 12:00:00 UTC`); if (Number.isFinite(ms)) result = new Date(ms).toISOString().slice(0, 10) }
    }
  } catch { /* optional metadata */ }
  await writeCache(path, { publishedDate: result })
  return result
}

const reps = new Map(proPlayerRepresentatives.map((rep) => [rep.id, rep.tag]))
const records = proVodCatalog.filter((vod) => vod.linkKind === 'source-index' && targetIds.has(vod.id))
const jobs: Array<{ vodId: string; query: string }> = []
const aliasById = new Map<string, { player: string[]; opponent: string[] }>()
for (const record of records) {
  const playerTag = reps.get(record.playerId) ?? record.playerId
  const player = aliasesFor(playerTag); const opponent = aliasesFor(record.opponentTag)
  aliasById.set(record.id, { player, opponent })
  const year = record.date.slice(0, 4)
  const fighterText = record.playerFighterIds.join(' ').replaceAll('-', ' ')
  const queries = new Set<string>()
  for (const p of player.slice(0, 4)) for (const o of opponent.slice(0, 4)) {
    queries.add(`${p} vs ${o}`); queries.add(`${o} vs ${p}`)
    queries.add(`${p} ${o} ${year}`); queries.add(`${p} ${o} SSBU`)
    queries.add(`${p} ${o} ${fighterText}`)
    if (!normalize(record.event).includes('indexed competitive set')) queries.add(`${record.event} ${p} ${o}`)
  }
  for (const query of queries) jobs.push({ vodId: record.id, query })
}

console.log(`TARGET_RECORDS=${records.length}`); console.log(`SEARCH_JOBS=${jobs.length}`); console.log(`CONCURRENCY=${concurrency}`)
const errors: unknown[] = []
const results = await mapConcurrent(jobs, concurrency, async (job, index) => {
  try { const candidates = await searchYoutube(job.query); if ((index + 1) % 100 === 0) console.log(`SEARCH_PROGRESS=${index + 1}/${jobs.length}`); return { ...job, candidates } }
  catch (error) { errors.push({ ...job, error: error instanceof Error ? error.message : String(error) }); return { ...job, candidates: [] as Candidate[] } }
})

const byVod = new Map<string, Map<string, Candidate>>()
for (const result of results) {
  const alias = aliasById.get(result.vodId); if (!alias) continue
  const map = byVod.get(result.vodId) ?? new Map<string, Candidate>()
  for (const candidate of result.candidates) if (containsAlias(candidate.title, alias.player) && containsAlias(candidate.title, alias.opponent) && !map.has(candidate.id)) map.set(candidate.id, candidate)
  byVod.set(result.vodId, map)
}
const uniqueIds = [...new Set([...byVod.values()].flatMap((map) => [...map.keys()]))]
const datePairs = await mapConcurrent(uniqueIds, 24, async (id) => [id, await publishedDate(id)] as const)
const dateById = new Map(datePairs)
const reportRecords = records.map((record) => ({
  vodId: record.id, title: record.title, sourceDate: record.date, playerFighterIds: record.playerFighterIds,
  candidates: [...(byVod.get(record.id)?.values() ?? [])].map((candidate) => ({ ...candidate, publishedDate: dateById.get(candidate.id) ?? null })),
}))
const recovered = reportRecords.filter((record) => record.candidates.length > 0)
const stillZero = reportRecords.filter((record) => record.candidates.length === 0)
const report = { targetRecords: records.length, searchJobs: jobs.length, candidateVideos: uniqueIds.length, recoveredCount: recovered.length, stillZeroCount: stillZero.length, errors: errors.length, recovered, stillZero: stillZero.map((r) => r.vodId) }
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`CANDIDATE_VIDEOS=${uniqueIds.length}`); console.log(`RECOVERED_RECORDS=${recovered.length}`); console.log(`STILL_ZERO=${stillZero.length}`); console.log(`ERRORS=${errors.length}`); console.log(`OUTPUT=${outputPath}`)
