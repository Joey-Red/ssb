import type { SourceRef } from '../types'
import { roster } from './roster'

function smashWikiUrl(name: string): string {
  const title = `${name.replace(/ /g, '_')}_(SSBU)`
  return `https://www.ssbwiki.com/${encodeURIComponent(title)}`
}

const rosterWikiSources: readonly SourceRef[] = roster.map((fighter) => ({
  id: `wiki-${fighter.id}`,
  label: `SmashWiki — ${fighter.name} (SSBU)`,
  url: smashWikiUrl(fighter.name),
  kind: 'wiki',
  note: 'Move utility, combo/throw descriptions, patch history, and matchup-independent gameplay reference. Practice routes are not labeled universally true unless the guide records stronger evidence.',
}))

const referenceFrameSources = [
  { id: 'ufd-mario', label: 'Ultimate Frame Data — Mario', url: 'https://ultimateframedata.com/mario', kind: 'frame-data', note: 'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id: 'ufd-squirtle', label: 'Ultimate Frame Data — Squirtle', url: 'https://ultimateframedata.com/pt_squirtle', kind: 'frame-data', note: 'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id: 'ufd-pyra', label: 'Ultimate Frame Data — Pyra', url: 'https://ultimateframedata.com/pyra', kind: 'frame-data', note: 'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id: 'ufd-mythra', label: 'Ultimate Frame Data — Mythra', url: 'https://ultimateframedata.com/mythra', kind: 'frame-data', note: 'Startup, active frames, landing lag, OOS, and movement reference.' },
] as const satisfies readonly SourceRef[]

export const sources = [...rosterWikiSources, ...referenceFrameSources] as const satisfies readonly SourceRef[]

export const sourceById = new Map<string, SourceRef>(sources.map((source) => [source.id, source]))
