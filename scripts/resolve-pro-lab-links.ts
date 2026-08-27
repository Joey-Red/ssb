import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import { proVodCatalog } from '../src/data/proLabVodsAll'
import type { ProVodRecord } from '../src/data/proLabTypes'

const API = 'https://api.smasharchives.com'
const reportPath = process.argv[2] ?? 'pro-lab-link-resolutions.json'
const tsOutputPath = process.argv[3]
const initialConcurrency = Number(process.env.PRO_LAB_RESOLVER_CONCURRENCY ?? 16)
const maxConcurrency = Number(process.env.PRO_LAB_RESOLVER_MAX_CONCURRENCY ?? 24)
const playerConcurrency = Number(process.env.PRO_LAB_RESOLVER_PLAYER_CONCURRENCY ?? 8)
const pageConcurrency = Number(process.env.PRO_LAB_RESOLVER_PAGE_CONCURRENCY ?? 4)
const cacheDir = process.env.PRO_LAB_RESOLVER_CACHE_DIR ?? '.cache/pro-lab-resolver'
const refreshCache = process.env.PRO_LAB_RESOLVER_REFRESH === '1'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('en-US')
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '')

const digitFold = (value: string) => normalize(value).replace(/0/g, 'o')
const sameName = (a: string, b: string) => normalize(a) === normalize(b) || digitFold(a) === digitFold(b)
const dateOnly = (value: string) => value.slice(0, 10)

interface ArchivePlayer { id: number; name: string }
interface ArchiveCharacter { id: string; name: string; aliases: string }
interface ArchiveVod {
  id: string
  uploadDate: string
  tournament: string
  round: string | null
  player1: ArchivePlayer
  player2: ArchivePlayer
  player1characters: ArchiveCharacter[]
  player2characters: ArchiveCharacter[]
  channel: { id: string; name: string }
}
interface ArchiveVodList { count: number; items: ArchiveVod[] }

type ResolutionTier = 'exact-date' | 'near-date-metadata' | 'event-round'

const fighterArchiveNames: Readonly<Record<string, readonly string[]>> = {
  'dark-samus': ['Dark Samus'],
  'dr-mario': ['Dr. Mario'],
  'ice-climbers': ['Ice Climbers'],
  'king-k-rool': ['King K. Rool'],
  'mega-man': ['Mega Man'],
  'meta-knight': ['Meta Knight'],
  'mii-brawler': ['Mii Brawler'],
  'mii-gunner': ['Mii Gunner'],
  'mii-swordfighter': ['Mii Swordfighter'],
  'min-min': ['Min Min'],
  'mr-game-and-watch': ['Mr. Game & Watch'],
  'pac-man': ['Pac-Man'],
  'piranha-plant': ['Piranha Plant'],
  'pokemon-trainer': ['Pokemon Trainer'],
  pyra: ['Pyra/Mythra'],
  mythra: ['Pyra/Mythra'],
  rob: ['R.O.B.'],
  'rosalina-and-luma': ['Rosalina & Luma'],
  'toon-link': ['Toon Link'],
  'wii-fit-trainer': ['Wii Fit Trainer'],
  'young-link': ['Young Link'],
  'zero-suit-samus': ['Zero Suit Samus'],
}

const compatibleCharacter = (record: ProVodRecord, names: readonly ArchiveCharacter[]) => {
  if (!names.length || !record.playerFighterIds.length) return true
  const expected = record.playerFighterIds.flatMap((fighterId) => fighterArchiveNames[fighterId] ?? [fighterId.replace(/-/g, ' ')])
  return names.some((archiveCharacter) => expected.some((value) => sameName(value, archiveCharacter.name)))
}

const tokenSet = (value: string) => new Set(
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !['the', 'ultimate', 'smash', 'bros', 'super'].includes(token)),
)

const tokenSimilarity = (a: string, b: string | null) => {
  if (!a || !b) return 0
  const left = tokenSet(a)
  const right = tokenSet(b)
  if (!left.size || !right.size) return 0
  let overlap = 0
  for (const token of left) if (right.has(token)) overlap += 1
  return overlap / Math.min(left.size, right.size)
}

const dateDeltaDays = (a: string, b: string) => {
  const left = Date.parse(`${dateOnly(a)}T00:00:00Z`)
  const right = Date.parse(`${dateOnly(b)}T00:00:00Z`)
  if (!Number.isFinite(left) || !Number.isFinite(right)) return Number.POSITIVE_INFINITY
  return Math.abs(left - right) / 86_400_000
}

class AdaptiveLimiter {
  private active = 0
  private limit: number
  private readonly queue: Array<() => void> = []
  private successfulSinceChange = 0

  constructor(initial: number, private readonly max: number) {
    this.limit = Math.max(1, Math.min(initial, max))
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.active -= 1
      this.drain()
    }
  }

  noteSuccess() {
    this.successfulSinceChange += 1
    if (this.successfulSinceChange >= 40 && this.limit < this.max) {
      this.limit += 1
      this.successfulSinceChange = 0
      console.log(`HTTP_CONCURRENCY_UP=${this.limit}`)
      this.drain()
    }
  }

  noteRateLimit() {
    const next = Math.max(4, Math.floor(this.limit / 2))
    if (next < this.limit) console.log(`HTTP_CONCURRENCY_DOWN=${next}`)
    this.limit = next
    this.successfulSinceChange = 0
  }

  currentLimit() {
    return this.limit
  }

  private acquire() {
    if (this.active < this.limit) {
      this.active += 1
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active += 1
        resolve()
      })
    })
  }

  private drain() {
    while (this.active < this.limit && this.queue.length) this.queue.shift()?.()
  }
}

const httpLimiter = new AdaptiveLimiter(initialConcurrency, maxConcurrency)

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

const cachePathFor = (url: URL) => join(cacheDir, `${createHash('sha256').update(url.toString()).digest('hex')}.json`)

async function readCache<T>(url: URL): Promise<T | null> {
  if (refreshCache) return null
  try {
    return JSON.parse(await readFile(cachePathFor(url), 'utf8')) as T
  } catch {
    return null
  }
}

async function writeCache(url: URL, value: unknown) {
  await mkdir(cacheDir, { recursive: true })
  await writeFile(cachePathFor(url), `${JSON.stringify(value)}\n`, 'utf8')
}

async function getJson<T>(url: URL): Promise<T> {
  const cached = await readCache<T>(url)
  if (cached !== null) return cached

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const result = await httpLimiter.run(async () => {
        const response = await fetch(url, { headers: { 'user-agent': 'Smash-Forge-Pro-Lab-Link-Resolver/2.0' } })
        if (response.status === 429) httpLimiter.noteRateLimit()
        if (!response.ok) {
          const error = new Error(`${response.status} ${response.statusText}: ${url}`)
          ;(error as Error & { status?: number; retryAfter?: string | null }).status = response.status
          ;(error as Error & { status?: number; retryAfter?: string | null }).retryAfter = response.headers.get('retry-after')
          throw error
        }
        const json = await response.json() as T
        httpLimiter.noteSuccess()
        return json
      })
      await writeCache(url, result)
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const status = (lastError as Error & { status?: number }).status
      if (status && status < 500 && status !== 429) break
      if (attempt < 5) {
        const retryAfter = Number((lastError as Error & { retryAfter?: string | null }).retryAfter)
        const fallback = Math.min(8_000, 300 * (2 ** (attempt - 1)))
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : fallback + Math.floor(Math.random() * 200)
        await sleep(delay)
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`)
}

async function findPlayer(tag: string): Promise<{ player: ArchivePlayer | null; reason?: string }> {
  const url = new URL('/player/search', API)
  url.searchParams.set('name', tag)
  try {
    const results = await getJson<ArchivePlayer[]>(url)
    const exact = results.filter((candidate) => sameName(candidate.name, tag))
    if (exact.length === 1) return { player: exact[0] }
    return { player: null, reason: exact.length ? 'ambiguous-exact-player-search' : 'unique-archive-player-not-found' }
  } catch (error) {
    return { player: null, reason: `player-search-error:${error instanceof Error ? error.message : String(error)}` }
  }
}

async function getPlayerVods(playerId: number): Promise<{ vods: ArchiveVod[]; error?: string }> {
  const firstUrl = new URL('/vod/player', API)
  firstUrl.searchParams.set('playerId', String(playerId))
  firstUrl.searchParams.set('page', '1')

  let first: ArchiveVodList
  try {
    first = await getJson<ArchiveVodList>(firstUrl)
  } catch (error) {
    return { vods: [], error: error instanceof Error ? error.message : String(error) }
  }

  const totalPages = Math.min(60, Math.max(1, Math.ceil(first.count / 10)))
  const pages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2)
  const fetched = await mapConcurrent(pages, pageConcurrency, async (page) => {
    const url = new URL('/vod/player', API)
    url.searchParams.set('playerId', String(playerId))
    url.searchParams.set('page', String(page))
    try {
      return { page, result: await getJson<ArchiveVodList>(url) }
    } catch (error) {
      return { page, result: null, error: error instanceof Error ? error.message : String(error) }
    }
  })

  const all = [...first.items]
  const errors: string[] = []
  for (const page of fetched) {
    if (page.result) all.push(...page.result.items)
    else errors.push(`page ${page.page}: ${page.error}`)
  }

  const seen = new Set<string>()
  const vods = all.filter((vod) => {
    if (seen.has(vod.id)) return false
    seen.add(vod.id)
    return true
  })
  return { vods, error: errors.length ? errors.join('; ') : undefined }
}

function candidateMetadata(record: ProVodRecord, candidate: ArchiveVod, archivePlayer: ArchivePlayer) {
  const primaryIs1 = candidate.player1.id === archivePlayer.id
  const primaryIs2 = candidate.player2.id === archivePlayer.id
  if (!primaryIs1 && !primaryIs2) return null
  const opponent = primaryIs1 ? candidate.player2 : candidate.player1
  const characters = primaryIs1 ? candidate.player1characters : candidate.player2characters
  if (!sameName(opponent.name, record.opponentTag) || !compatibleCharacter(record, characters)) return null
  return {
    candidate,
    dateDelta: dateDeltaDays(candidate.uploadDate, record.date),
    eventScore: tokenSimilarity(record.event, candidate.tournament),
    roundScore: tokenSimilarity(record.round, candidate.round),
  }
}

function chooseCandidate(record: ProVodRecord, archiveVods: readonly ArchiveVod[], archivePlayer: ArchivePlayer) {
  const base = archiveVods
    .map((candidate) => candidateMetadata(record, candidate, archivePlayer))
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)

  const exact = base.filter((candidate) => candidate.dateDelta === 0)
  if (exact.length === 1) return { match: exact[0], tier: 'exact-date' as ResolutionTier, candidates: exact }
  if (exact.length > 1) {
    const strong = exact.filter((candidate) => candidate.eventScore >= 0.5 || candidate.roundScore >= 0.8)
    if (strong.length === 1) return { match: strong[0], tier: 'exact-date' as ResolutionTier, candidates: exact }
    return { match: null, tier: null, candidates: exact }
  }

  const near = base.filter((candidate) => candidate.dateDelta <= 3 && (candidate.eventScore >= 0.45 || candidate.roundScore >= 0.8))
  if (near.length === 1) return { match: near[0], tier: 'near-date-metadata' as ResolutionTier, candidates: near }
  if (near.length > 1) return { match: null, tier: null, candidates: near }

  const eventRound = base.filter((candidate) => candidate.eventScore >= 0.8 && candidate.roundScore >= 0.8)
  if (eventRound.length === 1) return { match: eventRound[0], tier: 'event-round' as ResolutionTier, candidates: eventRound }
  return { match: null, tier: null, candidates: eventRound.length ? eventRound : base }
}

const unresolved = proVodCatalog.filter((vod) => vod.linkKind === 'source-index')
const representativeById = new Map(proPlayerRepresentatives.map((player) => [player.id, player]))
const byPlayer = new Map<string, ProVodRecord[]>()
for (const vod of unresolved) {
  const list = byPlayer.get(vod.playerId) ?? []
  list.push(vod)
  byPlayer.set(vod.playerId, list)
}

const resolutions: Record<string, string> = {}
const resolvedEvidence: Array<Record<string, unknown>> = []
const ambiguous: Array<Record<string, unknown>> = []
const unavailablePlayers: Array<Record<string, unknown>> = []
const playerStats: Array<Record<string, unknown>> = []
const tierCounts: Record<ResolutionTier, number> = { 'exact-date': 0, 'near-date-metadata': 0, 'event-round': 0 }

const playerEntries = [...byPlayer.entries()]
await mapConcurrent(playerEntries, playerConcurrency, async ([playerId, records]) => {
  const representative = representativeById.get(playerId)
  if (!representative) {
    unavailablePlayers.push({ playerId, reason: 'representative-not-found', records: records.length })
    return
  }

  const found = await findPlayer(representative.tag)
  if (!found.player) {
    unavailablePlayers.push({ playerId, tag: representative.tag, reason: found.reason, records: records.length })
    return
  }

  const archivePlayer = found.player
  const archiveResult = await getPlayerVods(archivePlayer.id)
  const archiveVods = archiveResult.vods
  let resolvedForPlayer = 0

  for (const record of records) {
    const selected = chooseCandidate(record, archiveVods, archivePlayer)
    if (selected.match && selected.tier) {
      const candidate = selected.match.candidate
      resolutions[record.id] = candidate.id
      tierCounts[selected.tier] += 1
      resolvedForPlayer += 1
      resolvedEvidence.push({
        vodId: record.id,
        youtubeId: candidate.id,
        tier: selected.tier,
        sourceDate: record.date,
        uploadDate: dateOnly(candidate.uploadDate),
        dateDeltaDays: selected.match.dateDelta,
        player: representative.tag,
        opponent: record.opponentTag,
        sourceEvent: record.event,
        archiveTournament: candidate.tournament,
        eventScore: selected.match.eventScore,
        sourceRound: record.round,
        archiveRound: candidate.round,
        roundScore: selected.match.roundScore,
        channel: candidate.channel.name,
      })
    } else if (selected.candidates.length > 1) {
      ambiguous.push({
        vodId: record.id,
        player: representative.tag,
        opponent: record.opponentTag,
        date: record.date,
        event: record.event,
        round: record.round,
        candidates: selected.candidates.slice(0, 12).map(({ candidate, dateDelta, eventScore, roundScore }) => ({
          id: candidate.id,
          uploadDate: dateOnly(candidate.uploadDate),
          dateDelta,
          tournament: candidate.tournament,
          eventScore,
          round: candidate.round,
          roundScore,
        })),
      })
    }
  }

  playerStats.push({
    playerId,
    tag: representative.tag,
    archivePlayerId: archivePlayer.id,
    unresolvedRecords: records.length,
    archiveVods: archiveVods.length,
    archiveError: archiveResult.error ?? null,
    resolved: resolvedForPlayer,
  })
  console.log(`${representative.tag}: ${resolvedForPlayer}/${records.length} resolved from ${archiveVods.length} archive VODs${archiveResult.error ? ' (partial/error)' : ''}`)
})

const sortedResolutions = Object.fromEntries(Object.entries(resolutions).sort(([a], [b]) => a.localeCompare(b)))
const resolvedIds = new Set(Object.keys(sortedResolutions))
const unresolvedReasons = unresolved
  .filter((record) => !resolvedIds.has(record.id))
  .map((record) => ({
    vodId: record.id,
    playerId: record.playerId,
    opponent: record.opponentTag,
    date: record.date,
    event: record.event,
    round: record.round,
    reason: ambiguous.some((item) => item.vodId === record.id) ? 'ambiguous-candidates' : unavailablePlayers.some((item) => item.playerId === record.playerId) ? 'player-unavailable' : 'no-high-confidence-candidate',
  }))

const report = {
  generatedAt: new Date().toISOString(),
  method: 'parallel-cached-high-confidence-player-opponent-character-date-event-round-match',
  concurrency: { initial: initialConcurrency, final: httpLimiter.currentLimit(), max: maxConcurrency, players: playerConcurrency, pagesPerPlayer: pageConcurrency },
  unresolvedInput: unresolved.length,
  resolvedCount: Object.keys(sortedResolutions).length,
  unresolvedAfter: unresolved.length - Object.keys(sortedResolutions).length,
  tierCounts,
  resolutions: sortedResolutions,
  resolvedEvidence: resolvedEvidence.sort((a, b) => String(a.vodId).localeCompare(String(b.vodId))),
  ambiguous: ambiguous.sort((a, b) => String(a.vodId).localeCompare(String(b.vodId))),
  unavailablePlayers: unavailablePlayers.sort((a, b) => String(a.playerId).localeCompare(String(b.playerId))),
  unresolvedReasons,
  playerStats: playerStats.sort((a, b) => String(a.playerId).localeCompare(String(b.playerId))),
}

await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

if (tsOutputPath) {
  await mkdir(dirname(tsOutputPath), { recursive: true })
  const entries = Object.entries(sortedResolutions).map(([vodId, youtubeId]) => `  '${vodId}': '${youtubeId}',`).join('\n')
  const ts = `import type { ProVodRecord } from './proLabTypes'\n\n/**\n * Resolver v2 bulk direct-watch recovery. Every entry is an automatically\n * accepted high-confidence unique match backed by Smasharchives player,\n * opponent, character and date/event/round evidence. Ambiguous candidates are\n * deliberately excluded and remain source-index records for manual review.\n */\nexport const proVodYoutubeResolutionsBulk2: Readonly<Record<string, string>> = {\n${entries}\n}\n\nexport function applyProVodLinkResolutionBulk2(vod: ProVodRecord): ProVodRecord {\n  const youtubeId = proVodYoutubeResolutionsBulk2[vod.id]\n  if (!youtubeId) return vod\n  const videoUrl = \`https://www.youtube.com/watch?v=\${youtubeId}\`\n  return {\n    ...vod,\n    videoUrl,\n    videoProvider: 'youtube',\n    videoId: youtubeId,\n    linkKind: 'direct-video',\n    analysisStatus: 'review-queued',\n    sourceUrls: [videoUrl, ...vod.sourceUrls.filter((url) => url !== videoUrl)],\n    quality: {\n      ...vod.quality,\n      visibleGameplay: true,\n      notes: [\n        ...vod.quality.notes,\n        'The gameplay-bearing YouTube set target was resolved by the high-confidence parallel link-recovery pass; tactical review remains pending.',\n      ],\n    },\n  }\n}\n`
  await writeFile(tsOutputPath, ts, 'utf8')
}

console.log(`RESOLVED_TOTAL=${report.resolvedCount}`)
console.log(`UNRESOLVED_AFTER=${report.unresolvedAfter}`)
console.log(`TIER_EXACT=${tierCounts['exact-date']}`)
console.log(`TIER_NEAR_DATE=${tierCounts['near-date-metadata']}`)
console.log(`TIER_EVENT_ROUND=${tierCounts['event-round']}`)
console.log(`HTTP_FINAL_CONCURRENCY=${httpLimiter.currentLimit()}`)
console.log(`OUTPUT=${reportPath}`)
if (tsOutputPath) console.log(`TS_OUTPUT=${tsOutputPath}`)
