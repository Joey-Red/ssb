import type { SourceRef } from '../types'

export const sources = [
  { id:'ufd-mario', label:'Ultimate Frame Data — Mario', url:'https://ultimateframedata.com/mario', kind:'frame-data', note:'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id:'wiki-mario', label:'SmashWiki — Mario (SSBU)', url:'https://www.ssbwiki.com/Mario_(SSBU)', kind:'wiki', note:'Move utility and throw-combo descriptions.' },
  { id:'ufd-squirtle', label:'Ultimate Frame Data — Squirtle', url:'https://ultimateframedata.com/pt_squirtle', kind:'frame-data', note:'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id:'wiki-squirtle', label:'SmashWiki — Squirtle (SSBU)', url:'https://www.ssbwiki.com/Squirtle_(SSBU)', kind:'wiki', note:'Combo starters, throw follow-ups, and approximate KO-confirm ranges.' },
  { id:'ufd-pyra', label:'Ultimate Frame Data — Pyra', url:'https://ultimateframedata.com/pyra', kind:'frame-data', note:'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id:'wiki-pyra', label:'SmashWiki — Pyra (SSBU)', url:'https://www.ssbwiki.com/Pyra_(SSBU)', kind:'wiki', note:'Down-tilt, down-air, throw follow-ups, and KO-confirm notes.' },
  { id:'ufd-mythra', label:'Ultimate Frame Data — Mythra', url:'https://ultimateframedata.com/mythra', kind:'frame-data', note:'Startup, active frames, landing lag, OOS, and movement reference.' },
  { id:'wiki-mythra', label:'SmashWiki — Mythra (SSBU)', url:'https://www.ssbwiki.com/Mythra_(SSBU)', kind:'wiki', note:'Tilt/throw combo utility and down-tilt KO-confirm descriptions.' },
] as const satisfies readonly SourceRef[]

export const sourceById = new Map<string,SourceRef>(sources.map((source)=>[source.id,source]))
