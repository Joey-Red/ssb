import { writeFile } from 'node:fs/promises'
import { proPlayerRepresentatives } from '../src/data/proLabRosterAll'
import { proVodCatalog } from '../src/data/proLabVodsAll'
import type { ProVodRecord } from '../src/data/proLabTypes'

const API = 'https://api.smasharchives.com'
const outputPath = process.argv[2] ?? 'pro-lab-link-resolutions.json'
const delayMs = Number(process.env.PRO_LAB_RESOLVER_DELAY_MS ?? 175)

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

async function getJson<T>(url: URL): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await sleep(delayMs * attempt)
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'Smash-Forge-Pro-Lab-Link-Resolver/1.0' } })
      if (response.ok) return response.json() as Promise<T>
      lastError = new Error(`${response.status} ${response.statusText}: ${url}`)
      if (response.status < 500 && response.status !== 429) break
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`)
}

async function findPlayer(tag: string): Promise<ArchivePlayer | null> {
  const url = new URL('/player/search', API)
  url.searchParams.set('name', tag)
  try {
    const results = await getJson<ArchivePlayer[]>(url)
    const exact = results.filter((candidate) => sameName(candidate.name, tag))
    if (exact.length === 1) return exact[0]
    return null
  } catch {
    return null
  }
}

async function getPlayerVods(playerId: number): Promise<{ vods: ArchiveVod[]; error?: string }> {
  const all: ArchiveVod[] = []
  const seen = new Set<string>()
  let expectedCount: number | null = null

  // Smasharchives pagination is one-based. page=0 falls through to the API's
  // latest-ten shortcut and makes a large player history appear to contain only 10 VODs.
  for (let page = 1; page <= 60; page += 1) {
    const url = new URL('/vod/player', API)
    url.searchParams.set('playerId', String(playerId))
    url.searchParams.set('page', String(page))
    let result: ArchiveVodList
    try {
      result = await getJson<ArchiveVodList>(url)
    } catch (error) {
      return { vods: all, error: error instanceof Error ? error.message : String(error) }
    }
    if (expectedCount === null) expectedCount = result.count
    if (!result.items.length) break

    let added = 0
    for (const vod of result.items) {
      if (seen.has(vod.id)) continue
      seen.add(vod.id)
      all.push(vod)
      added += 1
    }
    if (!added || all.length >= (expectedCount ?? 0)) break
  }
  return { vods: all }
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

for (const [playerId, records] of byPlayer) {
  const representative = representativeById.get(playerId)
  if (!representative) {
    unavailablePlayers.push({ playerId, reason: 'representative-not-found', records: records.length })
    continue
  }

  const archivePlayer = await findPlayer(representative.tag)
  if (!archivePlayer) {
    unavailablePlayers.push({ playerId, tag: representative.tag, reason: 'unique-archive-player-not-found', records: records.length })
    continue
  }

  const archiveResult = await getPlayerVods(archivePlayer.id)
  const archiveVods = archiveResult.vods
  let resolvedForPlayer = 0

  for (const record of records) {
    const candidates = archiveVods.filter((candidate) => {
      if (dateOnly(candidate.uploadDate) !== record.date) return false
      const primaryIs1 = candidate.player1.id === archivePlayer.id
      const primaryIs2 = candidate.player2.id === archivePlayer.id
      if (!primaryIs1 && !primaryIs2) return false
      const opponent = primaryIs1 ? candidate.player2 : candidate.player1
      const characters = primaryIs1 ? candidate.player1characters : candidate.player2characters
      return sameName(opponent.name, record.opponentTag) && compatibleCharacter(record, characters)
    })

    if (candidates.length === 1) {
      const candidate = candidates[0]
      resolutions[record.id] = candidate.id
      resolvedForPlayer += 1
      resolvedEvidence.push({
        vodId: record.id,
        youtubeId: candidate.id,
        sourceDate: record.date,
        player: representative.tag,
        opponent: record.opponentTag,
        archiveTournament: candidate.tournament,
        archiveRound: candidate.round,
        channel: candidate.channel.name,
      })
    } else if (candidates.length > 1) {
      ambiguous.push({
        vodId: record.id,
        player: representative.tag,
        opponent: record.opponentTag,
        date: record.date,
        candidates: candidates.map((candidate) => ({ id: candidate.id, tournament: candidate.tournament, round: candidate.round })),
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
}

const report = {
  generatedAt: new Date().toISOString(),
  method: 'strict-primary-player-opponent-upload-date-character-match',
  unresolvedInput: unresolved.length,
  resolvedCount: Object.keys(resolutions).length,
  unresolvedAfter: unresolved.length - Object.keys(resolutions).length,
  resolutions,
  resolvedEvidence,
  ambiguous,
  unavailablePlayers,
  playerStats,
}

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`RESOLVED_TOTAL=${report.resolvedCount}`)
console.log(`UNRESOLVED_AFTER=${report.unresolvedAfter}`)
console.log(`OUTPUT=${outputPath}`)
