#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'

const url = 'https://www.smash-tube.com/en/result?character1=Donkey%20Kong'
const response = await fetch(url, {
  redirect: 'follow',
  headers: {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36',
    accept: 'text/html,application/xhtml+xml',
  },
})
const text = await response.text()
await writeFile('smash-tube-probe.json', `${JSON.stringify({
  url,
  status: response.status,
  finalUrl: response.url,
  contentType: response.headers.get('content-type'),
  length: text.length,
  preview: text.slice(0, 50000),
}, null, 2)}\n`)
console.log(`Smash Tube probe: HTTP ${response.status}, ${text.length} bytes`)
