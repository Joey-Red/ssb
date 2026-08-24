import { useMemo, useState } from 'react'
import type { Combo, ComboKind } from '../types'
import { sourceById } from '../data/sources'
import { ComboKindBadge, ConfidenceBadge } from './Badge'
import { RouteLine } from './RouteLine'
import './ComboExplorer.css'

type KindFilter = 'all' | ComboKind
const kindOptions: { value: KindFilter; label: string }[] = [
  { value:'all',label:'All classifications' },{ value:'true',label:'True' },{ value:'kill-confirm',label:'Kill confirms' },{ value:'character-dependent',label:'Character dependent' },{ value:'di-dependent',label:'DI dependent' },{ value:'practice-route',label:'Practice routes' },
]

export function ComboExplorer({combos}:{combos:readonly Combo[]}) {
  const [kind,setKind]=useState<KindFilter>('all')
  const [percent,setPercent]=useState(40)
  const visible=useMemo(()=>combos.filter((combo)=>(kind==='all'||combo.kind===kind)&&percent>=combo.minPercent&&percent<=combo.maxPercent),[combos,kind,percent])
  return <section className="panel" aria-labelledby="combo-title">
    <div className="section-heading combo-heading"><div><p className="eyebrow">Combo explorer</p><h2 id="combo-title">Routes by percentage</h2></div><div className="combo-filters"><label><span className="sr-only">Combo classification</span><select value={kind} onChange={(event)=>setKind(event.target.value as KindFilter)}>{kindOptions.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="percent-filter"><span>{percent}%</span><input type="range" min="0" max="200" step="10" value={percent} onChange={(event)=>setPercent(Number(event.target.value))} aria-label="Target percentage"/></label></div></div>
    <div className="combo-list" aria-live="polite">{visible.length===0?<div className="empty-inline"><strong>No documented route in this filter.</strong><span>We do not invent a combo just to fill a percentage.</span></div>:visible.map((combo)=><article className="combo-card" key={combo.id}><div className="combo-card__header"><div><div className="badge-row"><ComboKindBadge kind={combo.kind}/><ConfidenceBadge confidence={combo.confidence}/></div><h3>{combo.label}</h3></div><span className="combo-window">{combo.minPercent}–{combo.maxPercent}%</span></div><RouteLine route={combo.route}/>{combo.execution&&<p className="combo-execution">{combo.execution}</p>}{combo.conditions&&combo.conditions.length>0&&<ul className="condition-list">{combo.conditions.map((condition)=><li key={condition}>{condition}</li>)}</ul>}<div className="source-links">{combo.sourceIds.map((id)=>{const source=sourceById.get(id);return source?<a href={source.url} target="_blank" rel="noreferrer" key={id}>{source.label}</a>:null})}</div></article>)}</div>
  </section>
}
