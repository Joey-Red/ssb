import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import type { ProVodRecord } from '../src/data/proLabTypes'
import { proVodYoutubeResolutionsBulk2 } from '../src/data/proLabVodLinkResolutionsBulk2'
import { proVodCatalog } from '../src/data/proLabVodsAll'

const reportPath = process.argv[2] ?? 'pro-lab-youtube-event-resolutions.json'
const tsOutputPath = process.argv[3] ?? 'src/data/proLabVodLinkResolutionsBulk3.ts'
const searchConcurrency = Number(process.env.PRO_LAB_YT_SEARCH_CONCURRENCY ?? 16)
const metadataConcurrency = Number(process.env.PRO_LAB_YT_METADATA_CONCURRENCY ?? 28)
const searchLimit = Number(process.env.PRO_LAB_YT_SEARCH_LIMIT ?? 20)
const maxDateDistanceDays = Number(process.env.PRO_LAB_YT_EVENT_MAX_DATE_DISTANCE_DAYS ?? 45)
const cacheDir = process.env.PRO_LAB_YT_CACHE_DIR ?? '.cache/pro-lab-youtube-resolver'
const ytDlp = process.env.YT_DLP_BIN ?? 'yt-dlp'
const innertubeKey = process.env.PRO_LAB_YT_INNERTUBE_KEY ?? 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const clientVersion = process.env.PRO_LAB_YT_CLIENT_VERSION ?? '2.20260820.01.00'

interface SearchCandidate {
  id: string
  title: string
  channel: string | null
  description: string | null
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
  .replace(/\bwinners? top \d+\b/g, ' ')
  .replace(/\blosers? top \d+\b/g, ' ')
  .replace(/\btop ?\d+\b/g, ' ')
  .replace(/\bpools?\b/g, ' ')
  .replace(/\bultimate singles\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const eventStopwords = new Set(['the', 'a', 'an', 'and', 'of', 'at', 'smash', 'ultimate', 'ssbu', 'tournament', 'singles'])

function eventMatches(record: ProVodRecord, candidate: SearchCandidate) {
  const base = eventBase(record.event)
  if (!base) return false
  const haystack = normalizeWords(`${candidate.title} ${candidate.description ?? ''}`)
  if (haystack.includes(base)) return true

  const tokens = base.split(' ').filter((token) => token && !eventStopwords.has(token))
  if (!tokens.length) return false
  const numericTokens = tokens.filter((token) => /^\d+$/.test(token))
  if (numericTokens.some((token) => !new RegExp(`(?:^| )${token}(?: |$)`).test(haystack))) return false
  const wordTokens = tokens.filter((token) => !/^\d+$/.test(token))
  const matchedWords = wordTokens.filter((token) => new RegExp(`(?:^| )${token}(?: |$)`).test(haystack)).length
  if (!wordTokens.length) return numericTokens.length >= 2
  if (wordTokens.length === 1) return wordTokens[0].length >= 4 && matchedWords === 1 && numericTokens.length > 0
  return matchedWords >= Math.max(2, Math.ceil(wordTokens.length * 0.6))
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
  try { return JSON.parse(await readFile(path, 'utf8')) as T } catch { return null }
}

async function writeJsonCache(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8')
}

async function runYtSearch(query: string): Promise<SearchCandidate[]> {
  const path = searchCachePath(query)
  const cached = await readJsonCache<SearchCandidate[]>(path)
  if (cached) return cached
  const args = ['--flat-playlist', '--playlist-end', String(searchLimit), '--dump-json', `ytsearch${searchLimit}:${query}`]
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
        query,
      })
    } catch { /* keep valid lines */ }
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

function isoDateFromText(value: string) {
  const timestamp = Date.parse(`${value} 12:00:00 UTC`)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null
}

async function fetchPublishedDate(id: string): Promise<string | null> {
  const path = metadataCachePath(id)
  const cached = await readJsonCache<{ publishedDate: string | null }>(path)
  if (cached) return cached.publishedDate
  let publishedDate: string | null = null
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${innertubeKey}&prettyPrint=false`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        },
        body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } }, videoId: id }),
      })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const json = await response.json() as unknown
      const exactText = findExactDateText(json)
      publishedDate = exactText ? isoDateFromText(exactText) : null
      break
    } catch (error) {
      if (attempt === 4) console.warn(`metadata ${id}: ${String(error)}`)
      else await new Promise((resolve) => setTimeout(resolve, 200 * (2 ** (attempt - 1))))
    }
  }
  await writeJsonCache(path, { publishedDate })
  return publishedDate
}

const dayDistance = (a: string, b: string) => Math.abs(Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000
const representativeById = new Map(proPlayerRepresentatives.map((player) => [player.id, player]))
const remaining = proVodCatalog.filter((vod) => vod.linkKind === 'source-index' && !proVodYoutubeResolutionsBulk2[vod.id])

interface Group {
  playerTag: string
  opponentTag: string
  event: string
  records: ProVodRecord[]
}

const missingRepresentative: string[] = []
const groups = new Map<string, Group>()
for (const record of remaining) {
  const representative = representativeById.get(record.playerId)
  if (!representative) { missingRepresentative.push(record.id); continue }
  const playerTag = representative.tag
  const base = eventBase(record.event)
  const key = `${normalizeWords(playerTag)}|${normalizeWords(record.opponentTag)}|${base}`
  const group = groups.get(key) ?? { playerTag, opponentTag: record.opponentTag, event: record.event, records: [] }
  group.records.push(record)
  groups.set(key, group)
}

console.log(`REMAINING_INPUT=${remaining.length}`)
console.log(`EVENT_SEARCH_GROUPS=${groups.size}`)
console.log(`SEARCH_CONCURRENCY=${searchConcurrency}`)
console.log(`METADATA_CONCURRENCY=${metadataConcurrency}`)

const searchErrors: Array<{ key: string; error: string }> = []
const groupEntries = [...groups.entries()]
const searched = await mapConcurrent(groupEntries, searchConcurrency, async ([key, group], index) => {
  const query = `${group.event} ${group.playerTag} ${group.opponentTag} Smash Ultimate`
  try {
    const all = await runYtSearch(query)
    const candidates = all.filter((candidate) =>
      containsName(candidate.title, group.playerTag)
      && containsName(candidate.title, group.opponentTag)
      && group.records.some((record) => eventMatches(record, candidate)),
    )
    if ((index + 1) % 25 === 0) console.log(`SEARCH_PROGRESS=${index + 1}/${groupEntries.length}`)
    return { key, group, candidates: [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()] }
  } catch (error) {
    searchErrors.push({ key, error: error instanceof Error ? error.message : String(error) })
    return { key, group, candidates: [] as SearchCandidate[] }
  }
})

const uniqueCandidates = new Map<string, SearchCandidate>()
for (const result of searched) for (const candidate of result.candidates) uniqueCandidates.set(candidate.id, candidate)
console.log(`EVENT_PAIR_CANDIDATES=${uniqueCandidates.size}`)

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
const noCandidate: string[] = []
const dateRejected: string[] = []

for (const result of searched) {
  const candidates = result.candidates
    .map((candidate) => datedById.get(candidate.id))
    .filter((candidate): candidate is DatedCandidate => candidate !== undefined)

  const usableByRecord = new Map<string, DatedCandidate[]>()
  for (const record of result.group.records) {
    const plausible = candidates.filter((candidate) => {
      if (!eventMatches(record, candidate)) return false
      if (candidate.publishedDate.slice(0, 4) !== record.date.slice(0, 4)) return false
      return dayDistance(record.date, candidate.publishedDate) <= maxDateDistanceDays
    })
    usableByRecord.set(record.id, plausible)
    if (!candidates.length) noCandidate.push(record.id)
    else if (!plausible.length) dateRejected.push(record.id)
  }

  const used = new Set<string>()
  const assigned = new Set<string>()

  // Strongest discriminator: exact canonical round within an event/pair group.
  for (const record of result.group.records) {
    const recordRound = roundClass(`${record.event} ${record.round}`)
    if (!recordRound) continue
    const roundMatches = (usableByRecord.get(record.id) ?? []).filter((candidate) => roundClass(candidate.title) === recordRound && !used.has(candidate.id))
    if (roundMatches.length !== 1) continue
    const candidate = roundMatches[0]
    resolutions[record.id] = candidate.id
    used.add(candidate.id)
    assigned.add(record.id)
    evidence.push({ vodId: record.id, youtubeId: candidate.id, player: result.group.playerTag, opponent: result.group.opponentTag, event: record.event, round: recordRound, sourceDate: record.date, publishedDate: candidate.publishedDate, distanceDays: dayDistance(record.date, candidate.publishedDate), title: candidate.title, channel: candidate.channel, method: 'event-pair-round-date-window-unique' })
  }

  // Single remaining record + single remaining candidate is safe after event/pair/year/date-window checks.
  const unresolvedRecords = result.group.records.filter((record) => !assigned.has(record.id))
  const remainingCandidates = candidates.filter((candidate) => !used.has(candidate.id))
  if (unresolvedRecords.length === 1) {
    const record = unresolvedRecords[0]
    const usable = (usableByRecord.get(record.id) ?? []).filter((candidate) => !used.has(candidate.id))
    if (usable.length === 1) {
      const candidate = usable[0]
      resolutions[record.id] = candidate.id
      used.add(candidate.id)
      assigned.add(record.id)
      evidence.push({ vodId: record.id, youtubeId: candidate.id, player: result.group.playerTag, opponent: result.group.opponentTag, event: record.event, sourceDate: record.date, publishedDate: candidate.publishedDate, distanceDays: dayDistance(record.date, candidate.publishedDate), title: candidate.title, channel: candidate.channel, method: 'event-pair-date-window-unique' })
    }
  } else if (unresolvedRecords.length === 1 && remainingCandidates.length === 1) {
    // Kept for readability; handled by the usable-candidate branch above.
  }

  // Character text can resolve a residual duplicate/reupload collision only when unique.
  for (const record of result.group.records.filter((item) => !assigned.has(item.id))) {
    const characterMatches = (usableByRecord.get(record.id) ?? [])
      .filter((candidate) => !used.has(candidate.id) && titleCharacterMatches(record, candidate.title, result.group.playerTag))
    if (characterMatches.length !== 1) continue
    const candidate = characterMatches[0]
    resolutions[record.id] = candidate.id
    used.add(candidate.id)
    assigned.add(record.id)
    evidence.push({ vodId: record.id, youtubeId: candidate.id, player: result.group.playerTag, opponent: result.group.opponentTag, event: record.event, sourceDate: record.date, publishedDate: candidate.publishedDate, distanceDays: dayDistance(record.date, candidate.publishedDate), title: candidate.title, channel: candidate.channel, method: 'event-pair-character-date-window-unique' })
  }

  for (const record of result.group.records.filter((item) => !assigned.has(item.id))) {
    const usable = (usableByRecord.get(record.id) ?? []).filter((candidate) => !used.has(candidate.id))
    if (usable.length) ambiguous.push({ vodId: record.id, event: record.event, player: result.group.playerTag, opponent: result.group.opponentTag, sourceDate: record.date, candidates: usable.map((candidate) => ({ id: candidate.id, title: candidate.title, publishedDate: candidate.publishedDate, round: roundClass(candidate.title) })) })
  }
}

const resolvedCount = Object.keys(resolutions).length
const projectedAfter = remaining.length - resolvedCount
const report = {
  generatedAt: new Date().toISOString(),
  remainingInput: remaining.length,
  searchGroups: groups.size,
  uniqueEventPairCandidates: uniqueCandidates.size,
  datedCandidates: datedById.size,
  resolvedCount,
  projectedTotalCatalogSourceIndexAfter: projectedAfter,
  combinedBulk2And3Resolved: Object.keys(proVodYoutubeResolutionsBulk2).length + resolvedCount,
  maxDateDistanceDays,
  missingRepresentative,
  noCandidate: [...new Set(noCandidate)],
  dateRejected: [...new Set(dateRejected)],
  ambiguous,
  searchErrors,
  evidence,
  resolutions,
}
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const entries = Object.entries(resolutions).sort(([a], [b]) => a.localeCompare(b))
const ts = `import type { ProVodRecord } from './proLabTypes'\n\n/**\n * Event-aware direct-watch recovery. Every mapping requires a verified event-name\n * match, exact player/opponent pair, same-year publish metadata within ${maxDateDistanceDays} days\n * of the source/event anchor, plus a unique round/character/candidate assignment.\n */\nexport const proVodYoutubeResolutionsBulk3: Readonly<Record<string, string>> = {\n${entries.map(([id, youtubeId]) => `  '${id}': '${youtubeId}',`).join('\n')}\n}\n\nexport function applyProVodLinkResolutionBulk3(vod: ProVodRecord): ProVodRecord {\n  const youtubeId = proVodYoutubeResolutionsBulk3[vod.id]\n  if (!youtubeId) return vod\n  const videoUrl = \`https://www.youtube.com/watch?v=\${youtubeId}\`\n  return {\n    ...vod,\n    videoUrl,\n    videoProvider: 'youtube',\n    videoId: youtubeId,\n    linkKind: 'direct-video',\n    analysisStatus: 'review-queued',\n    sourceUrls: [videoUrl, ...vod.sourceUrls.filter((url) => url !== videoUrl)],\n    quality: {\n      ...vod.quality,\n      visibleGameplay: true,\n      notes: [\n        ...vod.quality.notes,\n        'The direct YouTube target was recovered from matching event, player/opponent, publish-window, and unique round/character evidence; tactical review remains pending.',\n      ],\n    },\n  }\n}\n`
await writeFile(tsOutputPath, ts, 'utf8')

console.log(`RESOLVED_EVENT_TOTAL=${resolvedCount}`)
console.log(`COMBINED_BULK2_BULK3_RESOLVED=${Object.keys(proVodYoutubeResolutionsBulk2).length + resolvedCount}`)
console.log(`PROJECTED_ALL_UNRESOLVED_AFTER=${projectedAfter}`)
console.log(`AMBIGUOUS=${ambiguous.length}`)
console.log(`SEARCH_ERRORS=${searchErrors.length}`)
console.log(`OUTPUT=${reportPath}`)
console.log(`TS_OUTPUT=${tsOutputPath}`)
