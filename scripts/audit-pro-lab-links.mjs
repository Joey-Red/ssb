#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const sourcePaths = [
  'src/data/proLabRoster.ts',
  'src/data/proLabVods.ts',
]
const live = process.argv.includes('--live')
const timeoutMs = 12_000

const sources = await Promise.all(sourcePaths.map(async (path) => ({
  path,
  text: await readFile(path, 'utf8'),
})))

const urlPattern = /https:\/\/[^'"`\s)\]]+/g
const occurrences = []
for (const source of sources) {
  for (const match of source.text.matchAll(urlPattern)) {
    occurrences.push({ path: source.path, url: match[0] })
  }
}

const counts = new Map()
for (const entry of occurrences) counts.set(entry.url, (counts.get(entry.url) ?? 0) + 1)
const uniqueUrls = [...counts.keys()].sort()
const malformed = uniqueUrls.filter((value) => {
  try {
    const url = new URL(value)
    return url.protocol !== 'https:'
  } catch {
    return true
  }
})

const duplicateUrls = [...counts.entries()]
  .filter(([, count]) => count > 1)
  .map(([url, count]) => ({ url, occurrences: count }))

const youtubeIds = occurrences
  .map((entry) => {
    try {
      const url = new URL(entry.url)
      return url.hostname.endsWith('youtube.com') ? url.searchParams.get('v') : null
    } catch {
      return null
    }
  })
  .filter(Boolean)
const duplicateYoutubeIds = [...new Set(youtubeIds.filter((id, index) => youtubeIds.indexOf(id) !== index))]

async function checkUrl(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'ssb-pro-lab-maintenance/1.0' },
    })
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'ssb-pro-lab-maintenance/1.0',
          range: 'bytes=0-0',
        },
      })
    }
    const reachable = response.status >= 200 && response.status < 400
    return {
      url,
      status: response.status,
      reachable,
      finalUrl: response.url,
      note: reachable ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      url,
      status: null,
      reachable: null,
      finalUrl: null,
      note: error instanceof Error ? error.message : 'Request failed',
    }
  } finally {
    clearTimeout(timer)
  }
}

const liveChecks = live ? await Promise.all(uniqueUrls.map(checkUrl)) : []
const definitelyBroken = liveChecks.filter((entry) => entry.reachable === false)
const indeterminate = liveChecks.filter((entry) => entry.reachable === null)

const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  mode: live ? 'structural+live' : 'structural',
  sourcePaths,
  occurrenceCount: occurrences.length,
  uniqueUrlCount: uniqueUrls.length,
  malformed,
  duplicateUrls,
  duplicateYoutubeIds,
  liveChecks,
  definitelyBroken,
  indeterminate,
  policy: {
    productionRuntimeNetworkingChanged: false,
    externalChecksAreMaintenanceOnly: true,
    networkFailuresAreReportedNotGuessed: true,
  },
}

await writeFile('pro-lab-link-audit.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(`Pro Lab link audit: ${uniqueUrls.length} unique URLs, ${malformed.length} malformed, ${definitelyBroken.length} definitely broken, ${indeterminate.length} indeterminate.`)
if (malformed.length > 0) process.exitCode = 1
