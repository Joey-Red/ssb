import { fighterBySlug, roster } from '../data/roster'
import { hrefFor } from '../router'
import './FighterView.css'

export function FighterView({ slug }: { slug: string }) {
  const fighter = fighterBySlug.get(slug)
  if (!fighter) return <section className="panel empty-state"><span className="empty-state__icon" aria-hidden="true">?</span><h1>Fighter not found</h1><p>This roster route does not exist.</p><a className="button-link" href={hrefFor('/')}>Back to roster</a></section>

  const index = roster.findIndex((entry) => entry.id === fighter.id)
  const previous = roster[index - 1]
  const next = roster[index + 1]

  return (
    <div className="page-stack">
      <section className="fighter-header panel">
        <div className="fighter-header__mark" aria-hidden="true">{fighter.name.split(/\s|&/).filter(Boolean).slice(0,2).map((part) => part[0]).join('')}</div>
        <div><p className="eyebrow">{fighter.series} · Fighter {fighter.order}</p><h1>{fighter.name}</h1><p className="hero-copy">{fighter.guideStatus === 'ready' ? 'Reference guide data is being attached to this finished detail shell.' : 'Roster indexed. This guide will be populated in the full-roster content phase.'}</p></div>
        <span className={`status-pill status-pill--${fighter.guideStatus}`}>{fighter.guideStatus === 'ready' ? 'Reference guide' : 'Planned'}</span>
      </section>

      <section className="fighter-layout">
        <div className="panel"><p className="eyebrow">Memory aid</p><h2>Quick recall lives here.</h2><p className="hero-copy">Each finished fighter will lead with a 1–2 line practical memory aid before deeper material.</p></div>
        <div className="panel"><p className="eyebrow">Practice now</p><h2>0–200% routine</h2><p className="hero-copy">The next milestone adds the percentage ladder and execution notes without wide mobile tables.</p></div>
      </section>

      <nav className="fighter-pager" aria-label="Adjacent fighters">
        {previous ? <a href={hrefFor(`/fighter/${previous.slug}`)}>← <span>{previous.name}</span></a> : <span />}
        {next ? <a href={hrefFor(`/fighter/${next.slug}`)}><span>{next.name}</span> →</a> : <span />}
      </nav>
    </div>
  )
}
