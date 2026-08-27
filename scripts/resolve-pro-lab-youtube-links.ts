import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import type { ProVodRecord } from '../src/data/proLabTypes'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const reportPath = process.argv[2] ?? 'pro-lab-youtube-resolutions.json'
const tsOutputPath = process.argv[3] ?? 'src/data/proLabVodLinkResolutionsBulk2.ts'
const searchConcurrency = Number(process.env.PRO_LAB_YT_SEARCH_CONCURRENCY ?? 12)
const metadataConcurrency = Number(process.env.PRO_LAB_YT_METADATA_CONCURRENCY ?? 24)
const searchLimit = Number(process.env.PRO_LAB_YT_SEARCH_LIMIT ?? 25)
const cacheDir = process.env.PRO_LAB_YT_CACHE_DIR ?? '.cache/pro-lab-youtube-resolver'
const ytDlp = process.env.YT_DLP_BIN ?? 'yt-dlp'
const innertubeKey = process.env.PRO_LAB_YT_INNERTUBE_KEY ?? 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const clientVersion = process.env.PRO_LAB_YT_CLIENT_VERSION ?? '2.20260820.01.00'

interface SearchCandidate {
  id: string
  title: string
  channel: string | null
  description: string | null
  duration: number | null
  query: string
}

interface DatedCandidate extends SearchCandidate {
  publishedDate: string
}

const normalizeWords = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('en-US')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const foldDigits = (value: string) => normalizeWords(value).replace(/0/g, 'o')

const containsName = (text: string, name: string) => {
  const haystack = ` ${normalizeWords(text)} `
  const needle = normalizeWords(name)
  const foldedHaystack = ` ${foldDigits(text)} `
  const foldedNeedle = foldDigits(name)
  return (needle.length > 0 && haystack.includes(` ${needle} `))
    || (foldedNeedle.length > 0 && foldedHaystack.includes(` ${foldedNeedle} `))
}

const fighterNames: Readonly<Record<string, readonly string[]>> = {
  'dark-samus': ['dark samus'],
  'dr-mario': ['dr mario', 'doctor mario'],
  'ice-climbers': ['ice climbers', 'icies'],
  'king-k-rool': ['king k rool', 'k rool'],
  'mega-man': ['mega man', 'megaman'],
  'meta-knight': ['meta knight'],
  'mii-brawler': ['mii brawler'],
  'mii-gunner': ['mii gunner'],
  'mii-swordfighter': ['mii swordfighter'],
  'min-min': ['min min'],
  'mr-game-and-watch': ['mr game and watch', 'game and watch', 'mr game watch', 'gaw'],
  'pac-man': ['pac man', 'pacman'],
  'piranha-plant': ['piranha plant', 'plant'],
  'pokemon-trainer': ['pokemon trainer', 'pt'],
  pyra: ['pyra', 'pyra mythra', 'aegis'],
  mythra: ['mythra', 'pyra mythra', 'aegis'],
  rob: ['rob', 'r o b'],
  'rosalina-and-luma': ['rosalina and luma', 'rosalina luma', 'rosa'],
  'toon-link': ['toon link'],
  'wii-fit-trainer': ['wii fit trainer', 'wii fit'],
  'young-link': ['young link'],
  'zero-suit-samus': ['zero suit samus', 'zss'],
}

const playerCharacterText = (title: string, playerTag: string) => {
  const sides = title.split(/\b(?:vs\.?|versus)\b/i)
  const side = sides.find((part) => containsName(part, playerTag))
  if (!side) return null
  const groups = [...side.matchAll(/\(([^)]{1,80})\)/g)].map((match) => match[1])
  return groups.length ? groups.join(' ') : null
}

const titleCharacterMatches = (record: ProVodRecord, title: string, playerTag: string) => {
  const characterText = playerCharacterText(title, playerTag)
  if (!characterText) return false
  return record.playerFighterIds.some((fighterId) => {
    const aliases = fighterNames[fighterId] ?? [fighterId.replace(/-/g, ' ')]
    return aliases.some((alias) => containsName(characterText, alias))
  })
}

async function mapConcurrent<T, R>(items: readonly T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const searchCachePath = (query: string) => join(cacheDir, 'search', `${sha(query)}.json`)
const metadataCachePath = (id: string) => join(cacheDir, 'metadata', `${id}.json`)

async function readJsonCache<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return null
  }
}

async function writeJsonCache(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8')
}

async function runYtSearch(query: string): Promise<SearchCandidate[]> {
  const path = searchCachePath(query)
  const cached = await readJsonCache<SearchCandidate[]>(path)
  if (cached) return cached

  const args = [
    '--flat-playlist',
    '--playlist-end', String(searchLimit),
    '--dump-json',
    `ytsearch${searchLimit}:${query}`,
  ]

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(ytDlp, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { out += chunk })
    child.stderr.on('data', (chunk) => { err += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0 || out.trim()) resolve(out)
      else reject(new Error(`yt-dlp search failed (${code}): ${err.slice(-1000)}`))
    })
  })

  const candidates: SearchCandidate[] = []
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue
    try {
      const item = JSON.parse(line) as Record<string, unknown>
      const id = typeof item.id === 'string' ? item.id : ''
      const title = typeof item.title === 'string' ? item.title : ''
      if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title) continue
      candidates.push({
        id,
        title,
        channel: typeof item.channel === 'string' ? item.channel : typeof item.uploader === 'string' ? item.uploader : null,
        description: typeof item.description === 'string' ? item.description : null,
        duration: typeof item.duration === 'number' ? item.duration : null,
        query,
      })
    } catch {
      // Ignore a malformed output line; valid result lines remain usable.
    }
  }
  await writeJsonCache(path, candidates)
  return candidates
}

function findExactDateText(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const stack: unknown[] = [value]
  const exactDate = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/
  while (stack.length) {
    const current = stack.pop()
    if (!current || typeof current !== 'object') continue
    if (Array.isArray(current)) {
      stack.push(...current)
      continue
    }
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

function isoDateFromText(value: string) {
  const timestamp = Date.parse(`${value} 12:00:00 UTC`)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null
}

async function fetchPublishedDate(id: string): Promise<string | null> {
  const path = metadataCachePath(id)
  const cached = await readJsonCache<{ publishedDate: string | null }>(path)
  if (cached) return cached.publishedDate

  let publishedDate: string | null = null
  let lastError: unknown = null
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${innertubeKey}&prettyPrint=false`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        },
        body: JSON.stringify({
          context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } },
          videoId: id,
        }),
      })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const json = await response.json() as unknown
      const exactText = findExactDateText(json)
      publishedDate = exactText ? isoDateFromText(exactText) : null
      break
    } catch (error) {
      lastError = error
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** (attempt - 1))))
    }
  }
  if (lastError && publishedDate === null) console.warn(`metadata ${id}: ${String(lastError)}`)
  await writeJsonCache(path, { publishedDate })
  return publishedDate
}

const representativeById = new Map(proPlayerRepresentatives.map((player) => [player.id, player]))
const sourceIndexed = proVodCatalog.filter((vod) =>
  vod.linkKind === 'source-index'
  && vod.eventTier === 'unknown'
  && vod.round.includes('· source '),
)

const missingRepresentative: string[] = []
const groups = new Map<string, { playerTag: string; opponentTag: string; year: string; records: ProVodRecord[] }>()
for (const record of sourceIndexed) {
  const representative = representativeById.get(record.playerId)
  if (!representative) {
    missingRepresentative.push(record.id)
    continue
  }
  const playerTag = representative.tag
  const year = record.date.slice(0, 4)
  const key = `${normalizeWords(playerTag)}|${normalizeWords(record.opponentTag)}|${year}`
  const group = groups.get(key) ?? { playerTag, opponentTag: record.opponentTag, year, records: [] }
  group.records.push(record)
  groups.set(key, group)
}

console.log(`SOURCE_INDEXED_INPUT=${sourceIndexed.length}`)
console.log(`SEARCH_GROUPS=${groups.size}`)
console.log(`SEARCH_CONCURRENCY=${searchConcurrency}`)
console.log(`METADATA_CONCURRENCY=${metadataConcurrency}`)

const groupEntries = [...groups.entries()]
const searchErrors: Array<{ key: string; error: string }> = []
const searched = await mapConcurrent(groupEntries, searchConcurrency, async ([key, group], index) => {
  const query = `${group.playerTag} ${group.opponentTag} Smash Ultimate ${group.year}`
  try {
    const all = await runYtSearch(query)
    const pairMatches = all.filter((candidate) =>
      containsName(candidate.title, group.playerTag)
      && containsName(candidate.title, group.opponentTag),
    )
    if ((index + 1) % 25 === 0) console.log(`SEARCH_PROGRESS=${index + 1}/${groupEntries.length}`)
    return { key, group, candidates: pairMatches.slice(0, 15) }
  } catch (error) {
    searchErrors.push({ key, error: error instanceof Error ? error.message : String(error) })
    return { key, group, candidates: [] as SearchCandidate[] }
  }
})

const uniqueCandidates = new Map<string, SearchCandidate>()
for (const result of searched) for (const candidate of result.candidates) uniqueCandidates.set(candidate.id, candidate)
console.log(`PAIR_MATCH_CANDIDATES=${uniqueCandidates.size}`)

const candidateEntries = [...uniqueCandidates.values()]
const datedResults = await mapConcurrent(candidateEntries, metadataConcurrency, async (candidate, index) => {
  const publishedDate = await fetchPublishedDate(candidate.id)
  if ((index + 1) % 100 === 0) console.log(`METADATA_PROGRESS=${index + 1}/${candidateEntries.length}`)
  return publishedDate ? { ...candidate, publishedDate } satisfies DatedCandidate : null
})
const datedById = new Map(datedResults.filter((item): item is DatedCandidate => item !== null).map((item) => [item.id, item]))

const resolutions: Record<string, string> = {}
const evidence: Array<Record<string, unknown>> = []
const ambiguous: Array<Record<string, unknown>> = []
const noExactDateCandidate: string[] = []

for (const result of searched) {
  const byDate = new Map<string, DatedCandidate[]>()
  for (const candidate of result.candidates) {
    const dated = datedById.get(candidate.id)
    if (!dated) continue
    const list = byDate.get(dated.publishedDate) ?? []
    list.push(dated)
    byDate.set(dated.publishedDate, list)
  }

  const recordsByDate = new Map<string, ProVodRecord[]>()
  for (const record of result.group.records) {
    const list = recordsByDate.get(record.date) ?? []
    list.push(record)
    recordsByDate.set(record.date, list)
  }

  for (const [date, records] of recordsByDate) {
    const candidates = [...new Map((byDate.get(date) ?? []).map((candidate) => [candidate.id, candidate])).values()]
    if (!candidates.length) {
      noExactDateCandidate.push(...records.map((record) => record.id))
      continue
    }

    if (records.length === 1 && candidates.length === 1) {
      const record = records[0]
      const candidate = candidates[0]
      resolutions[record.id] = candidate.id
      evidence.push({ vodId: record.id, youtubeId: candidate.id, publishedDate: date, player: result.group.playerTag, opponent: result.group.opponentTag, title: candidate.title, channel: candidate.channel, method: 'exact-source-date-pair-unique' })
      continue
    }

    const possible = records.map((record) => ({
      record,
      candidates: candidates.filter((candidate) => titleCharacterMatches(record, candidate.title, result.group.playerTag)),
    }))
    const uniquelyAssigned = possible.filter((item) => item.candidates.length === 1)
    const candidateUse = new Map<string, number>()
    for (const item of uniquelyAssigned) candidateUse.set(item.candidates[0].id, (candidateUse.get(item.candidates[0].id) ?? 0) + 1)

    let resolvedHere = 0
    for (const item of uniquelyAssigned) {
      const candidate = item.candidates[0]
      if (candidateUse.get(candidate.id) !== 1) continue
      resolutions[item.record.id] = candidate.id
      resolvedHere += 1
      evidence.push({ vodId: item.record.id, youtubeId: candidate.id, publishedDate: date, player: result.group.playerTag, opponent: result.group.opponentTag, title: candidate.title, channel: candidate.channel, method: 'exact-source-date-pair-character-unique' })
    }

    const remainingRecords = records.filter((record) => !resolutions[record.id])
    if (remainingRecords.length) {
      ambiguous.push({
        date,
        player: result.group.playerTag,
        opponent: result.group.opponentTag,
        records: remainingRecords.map((record) => ({ id: record.id, fighters: record.playerFighterIds })),
        candidates: candidates.map((candidate) => ({ id: candidate.id, title: candidate.title, channel: candidate.channel })),
        resolvedHere,
      })
    }
  }
}

const sortedResolutions = Object.fromEntries(Object.entries(resolutions).sort(([a], [b]) => a.localeCompare(b)))
const unresolvedAfter = sourceIndexed.filter((record) => !sortedResolutions[record.id])
const report = {
  generatedAt: new Date().toISOString(),
  method: 'youtube-search-plus-innertube-exact-source-date-pair',
  sourceIndexedInput: sourceIndexed.length,
  searchGroups: groups.size,
  uniquePairCandidates: uniqueCandidates.size,
  datedCandidates: datedById.size,
  resolvedCount: Object.keys(sortedResolutions).length,
  unresolvedSourceIndexedAfter: unresolvedAfter.length,
  totalCatalogSourceIndexBefore: proVodCatalog.filter((vod) => vod.linkKind === 'source-index').length,
  projectedTotalCatalogSourceIndexAfter: proVodCatalog.filter((vod) => vod.linkKind === 'source-index').length - Object.keys(sortedResolutions).length,
  resolutions: sortedResolutions,
  evidence: evidence.sort((a, b) => String(a.vodId).localeCompare(String(b.vodId))),
  ambiguous,
  noExactDateCandidate,
  missingRepresentative,
  searchErrors,
}

await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const entries = Object.entries(sortedResolutions).map(([vodId, youtubeId]) => `  '${vodId}': '${youtubeId}',`).join('\n')
const ts = `import type { ProVodRecord } from './proLabTypes'\n\n/**\n * Bulk direct-watch recovery from the public Smash Tube source anchors.\n * Each mapping requires the exact indexed player/opponent pair plus a YouTube\n * publish date equal to the stored source-date anchor. Same-date collisions are\n * accepted only when the indexed player character makes the assignment unique.\n */\nexport const proVodYoutubeResolutionsBulk2: Readonly<Record<string, string>> = {\n${entries}\n}\n\nexport function applyProVodLinkResolutionBulk2(vod: ProVodRecord): ProVodRecord {\n  const youtubeId = proVodYoutubeResolutionsBulk2[vod.id]\n  if (!youtubeId) return vod\n  const videoUrl = \`https://www.youtube.com/watch?v=\${youtubeId}\`\n  return {\n    ...vod,\n    videoUrl,\n    videoProvider: 'youtube',\n    videoId: youtubeId,\n    linkKind: 'direct-video',\n    analysisStatus: 'review-queued',\n    sourceUrls: [videoUrl, ...vod.sourceUrls.filter((url) => url !== videoUrl)],\n    quality: {\n      ...vod.quality,\n      visibleGameplay: true,\n      notes: [\n        ...vod.quality.notes,\n        'The gameplay-bearing YouTube target was recovered from the indexed player/opponent pair and exact source-date anchor; tactical review remains pending.',\n      ],\n    },\n  }\n}\n`
await mkdir(dirname(tsOutputPath), { recursive: true })
await writeFile(tsOutputPath, ts, 'utf8')

console.log(`RESOLVED_TOTAL=${report.resolvedCount}`)
console.log(`SOURCE_INDEXED_UNRESOLVED_AFTER=${report.unresolvedSourceIndexedAfter}`)
console.log(`PROJECTED_ALL_UNRESOLVED_AFTER=${report.projectedTotalCatalogSourceIndexAfter}`)
console.log(`AMBIGUOUS_GROUPS=${ambiguous.length}`)
console.log(`SEARCH_ERRORS=${searchErrors.length}`)
console.log(`OUTPUT=${reportPath}`)
console.log(`TS_OUTPUT=${tsOutputPath}`)
