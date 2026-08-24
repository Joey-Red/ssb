import { useMemo, useState } from 'react'
import type { TrainingStep } from '../types'
import { ConfidenceBadge } from './Badge'
import { RouteLine } from './RouteLine'
import './TrainingLadder.css'

export function TrainingLadder({steps}:{steps:readonly TrainingStep[]}) {
  const [selectedPercent,setSelectedPercent]=useState(steps[0]?.percent??0)
  const selected=useMemo(()=>steps.find((step)=>step.percent===selectedPercent)??steps[0],[selectedPercent,steps])
  if(!selected)return null
  return <section className="panel training-panel" aria-labelledby="training-title">
    <div className="section-heading"><div><p className="eyebrow">Training ladder</p><h2 id="training-title">Practice from 0–200%</h2></div><span className="section-meta">Mario baseline · conditions vary</span></div>
    <div className="percent-strip" aria-label="Choose training percentage">{steps.map((step)=><button className={`percent-button${step.percent===selected.percent?' is-active':''}`} key={step.percent} type="button" onClick={()=>setSelectedPercent(step.percent)} aria-pressed={step.percent===selected.percent}>{step.percent}%</button>)}</div>
    <div className="practice-now"><div className="practice-now__percent" aria-hidden="true">{selected.percent}%</div><div className="practice-now__body"><div className="practice-now__topline"><span>Practice now</span><ConfidenceBadge confidence={selected.confidence}/></div><RouteLine route={selected.route}/><p className="practice-purpose">{selected.purpose}</p>{selected.notes&&<p className="practice-note">{selected.notes}</p>}</div></div>
    <details className="routine-details"><summary>Show full 0–200 routine</summary><div className="routine-list">{steps.map((step)=><button type="button" className={`routine-row${step.percent===selected.percent?' is-active':''}`} key={step.percent} onClick={()=>setSelectedPercent(step.percent)}><span className="routine-percent">{step.percent}%</span><span className="routine-route"><RouteLine route={step.route} compact/></span><span className="routine-purpose">{step.purpose}</span></button>)}</div></details>
  </section>
}
