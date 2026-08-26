import { useEffect, useMemo, useState } from 'react'
import { officialFighterRenderUrl } from '../data/officialFighterAssets'
import { fighterBySlug, roster } from '../data/roster'
import { loadVisualMediaForFighter } from '../data/visualMedia'
import { useFrameDataIndex } from '../lib/useFrameData'
import { hrefFor } from '../router'
import type { FrameMove, MoveCategory, VisualMediaVariant, VisualMoveMedia, VisualSpriteSheet } from '../types'
import { FighterPicture } from './FighterPicture'
import './AllMovesView.css'

const categories: readonly (MoveCategory | 'all')[] = ['all', 'ground', 'aerial', 'special', 'grab', 'defense', 'misc']

function localMediaUrl(src: string): string {
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

function value(raw: string | null): string {
  return raw ?? '—'
}

function previewVariant(media: VisualMoveMedia | undefined): VisualMediaVariant | undefined {
  const variants = media?.variants ?? []
  return variants.find((variant) => variant.animationSrc && variant.sourceFormat !== 'synthetic-illustrative')
    ?? variants.find((variant) => variant.spriteSheet && variant.sourceFormat !== 'synthetic-illustrative' && variant.coverage !== 'static')
    ?? variants.find((variant) => variant.animationSrc)
    ?? variants.find((variant) => variant.spriteSheet)
    ?? variants.find((variant) => variant.imageSrc)
    ?? variants[0]
}

function SpritePreview({ sheet, label, playing }: { sheet: VisualSpriteSheet; label: string; playing: boolean }) {
  const [cell, setCell] = useState(0)

  useEffect(() => {
    setCell(0)
    if (!playing || sheet.frameCount <= 1) return
    const reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return
    const timer = window.setInterval(() => setCell((current) => (current + 1) % sheet.frameCount), 100)
    return () => window.clearInterval(timer)
  }, [playing, sheet.frameCount, sheet.src])

  const safeCell = Math.min(Math.max(cell, 0), Math.max(0, sheet.frameCount - 1))
  const column = safeCell % sheet.columns
  const row = Math.floor(safeCell / sheet.columns)
  const rows = Math.ceil(sheet.frameCount / sheet.columns)
  const sheetWidth = sheet.frameWidth * sheet.columns
  const sheetHeight = sheet.frameHeight * rows

  return (
    <svg className="move-gallery-card__sprite" viewBox={`0 0 ${sheet.frameWidth} ${sheet.frameHeight}`} role="img" aria-label={`${label} local playback preview`}>
      <image href={localMediaUrl(sheet.src)} width={sheetWidth} height={sheetHeight} x={-column * sheet.frameWidth} y={-row * sheet.frameHeight} preserveAspectRatio="none" />
    </svg>
  )
}

function MovePreview({ fighterId, fighterName, move, media, playing }: { fighterId: string; fighterName: string; move: FrameMove; media: VisualMoveMedia | undefined; playing: boolean }) {
  const variant = previewVariant(media)
  const sheet = variant?.spriteSheet ?? media?.spriteSheet
  const animationSrc = variant?.animationSrc ?? media?.animatedPreviewUrl
  const staticSrc = variant?.imageSrc
  const isSynthetic = variant?.sourceFormat === 'synthetic-illustrative'
  const isRelated = variant?.mappingMethod === 'runtime-related-source-alias-not-coverage-evidence'
  const isUntimedSource = variant?.timelineClass === 'source-animation' || variant?.coverage === 'untimed-animation'
  const status = isSynthetic ? 'Timing schematic' : isRelated ? 'Related source' : isUntimedSource ? 'Source animation' : media ? 'Source-backed' : 'Timing only'
  const statusClass = isSynthetic || isRelated || isUntimedSource ? ' is-reference' : media ? ' is-source' : ' is-reference'

  let visual
  if (playing && animationSrc) {
    visual = <img src={localMediaUrl(animationSrc)} alt={`${fighterName} ${move.name} playback`} loading="lazy" decoding="async" />
  } else if (sheet) {
    visual = <SpritePreview sheet={sheet} label={`${fighterName} ${move.name}`} playing={playing} />
  } else if (staticSrc) {
    visual = <img src={localMediaUrl(staticSrc)} alt={`${fighterName} ${move.name} source reference`} loading="lazy" decoding="async" />
  } else {
    visual = <img className="move-gallery-card__fighter" src={officialFighterRenderUrl(fighterId)} alt={`${fighterName} render`} loading="lazy" decoding="async" />
  }

  return (
    <article className="move-gallery-card">
      <div className="move-gallery-card__stage">
        {visual}
        <span className={`move-gallery-card__status${statusClass}`}>{status}</span>
        {!playing && <span className="move-gallery-card__paused">Paused</span>}
      </div>
      <div className="move-gallery-card__body">
        <div className="move-gallery-card__title"><div><span>{move.category}</span><h2>{move.name}</h2></div>{media && (media.variants?.length ?? 0) > 1 && <small>+{(media.variants?.length ?? 1) - 1} variants</small>}</div>
        <dl className="move-gallery-card__facts">
          <div><dt>Startup</dt><dd>{value(move.startup)}</dd></div>
          <div><dt>Active</dt><dd>{value(move.active)}</dd></div>
          <div><dt>Total</dt><dd>{value(move.totalFrames)}</dd></div>
          <div><dt>Damage</dt><dd>{value(move.damage)}</dd></div>
        </dl>
      </div>
    </article>
  )
}

export function AllMovesView({ slug }: { slug: string }) {
  const fighter = fighterBySlug.get(slug)
  const frameState = useFrameDataIndex()
  const [visualIndex, setVisualIndex] = useState<Map<string, VisualMoveMedia> | null>(null)
  const [visualError, setVisualError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MoveCategory | 'all'>('all')
  const [playing, setPlaying] = useState(() => !(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches))

  useEffect(() => {
    if (!fighter) return
    let cancelled = false
    setVisualIndex(null)
    setVisualError(null)
    void loadVisualMediaForFighter(fighter.id)
      .then((index) => { if (!cancelled) setVisualIndex(index) })
      .catch((error: unknown) => {
        if (cancelled) return
        setVisualError(error instanceof Error ? error.message : 'Local visual index failed to load.')
      })
    return () => { cancelled = true }
  }, [fighter])

  const frameData = fighter ? frameState.data?.byFighterId.get(fighter.id) : undefined
  const normalized = query.trim().toLowerCase()
  const moves = useMemo(() => (frameData?.moves ?? [])
    .filter((move) => category === 'all' || move.category === category)
    .filter((move) => !normalized || [move.name, move.category, move.hitboxType ?? ''].join(' ').toLowerCase().includes(normalized)), [category, frameData?.moves, normalized])

  if (!fighter) {
    return <section className="panel empty-state"><span className="empty-state__icon" aria-hidden="true">404</span><h1>Fighter not found</h1><p>The requested move gallery does not match a known fighter.</p><a className="button-link" href={hrefFor('/')}>Return to roster</a></section>
  }

  const index = roster.findIndex((entry) => entry.id === fighter.id)
  const previous = index > 0 ? roster[index - 1] : roster[roster.length - 1]
  const next = index < roster.length - 1 ? roster[index + 1] : roster[0]

  return (
    <div className="move-gallery page-stack">
      <section className="move-gallery-hero">
        <div className="move-gallery-hero__fighter"><FighterPicture fighterId={fighter.id} name={fighter.name} series={fighter.series} compact /></div>
        <div className="move-gallery-hero__copy"><p className="eyebrow">All move playbacks</p><h1>{fighter.name}</h1><p>Scan the whole kit without opening individual frame-data rows. Local source animations play automatically; schematic and related-source fallbacks stay explicitly labeled.</p></div>
        <div className="move-gallery-hero__actions"><a href={hrefFor(`/fighter/${fighter.slug}`)}>← Full guide</a><a href={hrefFor(`/practice/${fighter.slug}`)}>Practice mode</a></div>
      </section>

      <section className="move-gallery-toolbar" aria-label="Move gallery controls">
        <label className="move-gallery-search"><span className="sr-only">Search moves</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search moves…" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear move search">×</button>}</label>
        <div className="move-gallery-tabs" aria-label="Move category filter">{categories.map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <button type="button" className="move-gallery-play" aria-pressed={playing} onClick={() => setPlaying((current) => !current)}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>{playing ? 'Pause all' : 'Play all'}</button>
      </section>

      {frameState.loading ? <section className="panel loading-panel" role="status">Loading move data…</section>
        : !frameData ? <section className="panel empty-state"><h2>Frame data unavailable</h2><p>{frameState.error ?? 'This fighter is not present in the local frame-data snapshot.'}</p></section>
          : <>
            <div className="move-gallery-summary"><strong>{moves.length}</strong><span>{category === 'all' ? 'moves shown' : `${category} moves`}</span>{visualIndex ? <small>{visualIndex.size}/{frameData.moves.length} local playback entries loaded</small> : <small>{visualError ?? 'Loading local playbacks…'}</small>}</div>
            <section className="move-gallery-grid" aria-label={`${fighter.name} move playbacks`}>
              {moves.map((move) => <MovePreview key={move.id} fighterId={fighter.id} fighterName={fighter.name} move={move} media={visualIndex?.get(move.id)} playing={playing} />)}
            </section>
            {moves.length === 0 && <section className="panel empty-state"><span className="empty-state__icon" aria-hidden="true">?</span><h2>No moves match</h2><p>Change the category or search term.</p></section>}
          </>}

      {previous && next && <nav className="move-gallery-pager" aria-label="Adjacent fighter move galleries"><a href={hrefFor(`/fighter/${previous.slug}/moves`)}><span>← Previous</span><strong>{previous.name}</strong></a><a href={hrefFor(`/fighter/${next.slug}/moves`)}><span>Next →</span><strong>{next.name}</strong></a></nav>}
    </div>
  )
}
