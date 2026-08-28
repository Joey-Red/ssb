import { useMemo, useState } from 'react'
import type { TechniqueProgression as TechniqueProgressionData, TechniqueTier, TechniqueVerdict } from '../data/diddyKongProgression'
import { sourceById } from '../data/sources'
import { RouteLine } from './RouteLine'
import './TechniqueProgression.css'

const tiers: readonly { value: TechniqueTier; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'pro', label: 'Pro' },
  { value: 'godlike', label: 'Godlike' },
]

const verdictLabels: Readonly<Record<TechniqueVerdict, string>> = {
  'source-true': 'Video: true',
  conditional: 'Conditional',
  concept: 'Technique concept',
  'source-not-true': 'Video: not true',
}

function timestampLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function timestampUrl(sourceUrl: string, seconds: number): string {
  const url = new URL(sourceUrl)
  url.searchParams.set('t', `${seconds}s`)
  return url.toString()
}

export function TechniqueProgression({ progression }: { progression: TechniqueProgressionData }) {
  const [tier, setTier] = useState<TechniqueTier>('beginner')
  const source = sourceById.get(progression.sourceId)
  const visible = useMemo(
    () => progression.techniques.filter((technique) => technique.tier === tier),
    [progression.techniques, tier],
  )

  return <section className="panel progression" aria-labelledby="progression-title">
    <div className="section-heading progression__heading">
      <div><p className="eyebrow">Video technique index</p><h2 id="progression-title">{progression.title}</h2></div>
      <span className="progression__count">{progression.techniques.length} route families</span>
    </div>
    <p className="progression__description">{progression.description} “Opponent start” is the target’s damage at the beginning of the demonstrated sequence, not a universal combo window.</p>
    <div className="progression__tabs" role="tablist" aria-label="Technique difficulty">
      {tiers.map((option) => {
        const count = progression.techniques.filter((technique) => technique.tier === option.value).length
        return <button key={option.value} type="button" role="tab" aria-selected={tier === option.value} className={tier === option.value ? 'is-active' : ''} onClick={() => setTier(option.value)}>{option.label}<span>{count}</span></button>
      })}
    </div>
    <div className="progression__list">
      {visible.map((technique) => <article className="progression-card" key={technique.id}>
        <div className="progression-card__header"><div><span className={`progression-verdict progression-verdict--${technique.verdict}`}>{verdictLabels[technique.verdict]}</span><span className="progression-start">Opponent start: {technique.opponentStartPercent}%</span><h3>{technique.label}</h3></div>{source && <a href={timestampUrl(source.url, technique.timestampSeconds)} target="_blank" rel="noreferrer">Watch {timestampLabel(technique.timestampSeconds)}</a>}</div>
        <RouteLine route={technique.route} />
        {technique.note && <p>{technique.note}</p>}
        {technique.caveats && technique.caveats.length > 0 && <ul>{technique.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>}
      </article>)}
    </div>
    {source && <p className="progression__source">Source: <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>. “Video: true/not true” reproduces the source overlay; it is not a roster-wide guarantee.</p>}
  </section>
}
