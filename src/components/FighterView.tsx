import { guideByFighterId } from '../data/guides'
import { fighterBySlug, roster } from '../data/roster'
import { sourceById } from '../data/sources'
import { formatFrames } from '../lib/frame'
import { hrefFor } from '../router'
import { ComboExplorer } from './ComboExplorer'
import { TrainingLadder } from './TrainingLadder'
import './FighterView.css'

export function FighterView({slug}:{slug:string}) {
  const fighter=fighterBySlug.get(slug)
  if(!fighter)return <NotFoundFighter/>
  const guide=guideByFighterId.get(fighter.id)
  const index=roster.findIndex((entry)=>entry.id===fighter.id)
  const previous=index>0?roster[index-1]:roster[roster.length-1]
  const next=index<roster.length-1?roster[index+1]:roster[0]
  if(!guide)return <div className="page-stack"><FighterHeader name={fighter.name} series={fighter.series} archetype="Roster indexed · guide data pending" memoryAid="This fighter is already wired into routing/search. Its verified memory aid, 0–200% routine, and combo data arrive during the full-roster content milestones."/><section className="panel pending-panel"><span className="pending-icon" aria-hidden="true">+</span><div><p className="eyebrow">Data status</p><h2>Foundation ready; guide pending</h2><p>We intentionally show a clear pending state instead of filler combos. Mario, Squirtle, Pyra, and Mythra are the first reference implementations.</p><a className="button-link" href={hrefFor('/')}>Back to roster</a></div></section><FighterPager previous={previous} next={next}/></div>
  return <div className="page-stack"><FighterHeader name={fighter.name} series={fighter.series} archetype={guide.archetype} memoryAid={guide.memoryAid}/><div className="fighter-layout"><main className="fighter-main"><TrainingLadder steps={guide.trainingRoutine}/><ComboExplorer combos={guide.combos}/></main><aside className="fighter-side" aria-label={`${fighter.name} quick guide`}><section className="panel sticky-panel"><div className="section-heading"><div><p className="eyebrow">Quick guide</p><h2>What to remember</h2></div></div><ol className="quick-list">{guide.quickGuide.map((item,itemIndex)=><li key={item}><span>{String(itemIndex+1).padStart(2,'0')}</span><p>{item}</p></li>)}</ol><div className="subsection"><h3>Key startup frames</h3><div className="frame-list">{guide.keyFrames.map((frame)=><div className="frame-row" key={frame.move}><span><strong>{frame.move}</strong><small>{frame.note}</small></span><b>{formatFrames(frame.startup)}</b></div>)}</div><p className="frame-footnote">Startup is the first frame the relevant hitbox can appear. Standard Smash frame notation only.</p></div><details className="source-details"><summary>Sources & verification</summary><div className="source-stack">{guide.sourceIds.map((id)=>{const source=sourceById.get(id);return source?<a href={source.url} target="_blank" rel="noreferrer" key={id}><strong>{source.label}</strong><span>{source.note}</span></a>:null})}</div></details></section></aside></div><FighterPager previous={previous} next={next}/></div>
}

function FighterHeader({name,series,archetype,memoryAid}:{name:string;series:string;archetype:string;memoryAid:string}){const initials=name.split(/\s|&/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('');return <section className="fighter-hero"><div className="fighter-hero__mark" aria-hidden="true">{initials}</div><div className="fighter-hero__content"><div className="fighter-hero__meta"><span>{series}</span><span>•</span><span>{archetype}</span></div><h1>{name}</h1><div className="memory-aid"><span>Memory aid</span><p>{memoryAid}</p></div></div></section>}
function FighterPager({previous,next}:{previous:(typeof roster)[number]|undefined;next:(typeof roster)[number]|undefined}){if(!previous||!next)return null;return <nav className="fighter-pager" aria-label="Adjacent fighters"><a href={hrefFor(`/fighter/${previous.slug}`)}><span>← Previous</span><strong>{previous.name}</strong></a><a href={hrefFor(`/fighter/${next.slug}`)}><span>Next →</span><strong>{next.name}</strong></a></nav>}
function NotFoundFighter(){return <section className="panel empty-state"><span className="empty-state__icon" aria-hidden="true">404</span><h1>Fighter not found</h1><p>The roster route does not match a known fighter.</p><a className="button-link" href={hrefFor('/')}>Return to roster</a></section>}
