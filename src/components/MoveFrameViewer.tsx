import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { officialFighterRenderUrl } from '../data/officialFighterAssets'
import { loadVisualMediaForFighter } from '../data/visualMedia'
import type { FrameMove, VisualFramePhase, VisualMoveMedia, VisualSpriteSheet } from '../types'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import './MoveFrameViewer.css'

type PlaybackSpeed = 0.25 | 0.5 | 1

function fallbackPhase(frame: number, activeStart: number | null, activeEnd: number | null): VisualFramePhase {
  if (activeStart === null || activeEnd === null) return 'other'
  if (frame < activeStart) return 'startup'
  if (frame <= activeEnd) return 'active'
  return 'recovery'
}

function localMediaUrl(src: string): string {
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

function SpriteFrame({ sheet, cellIndex, frame, label, frameKind }: { sheet: VisualSpriteSheet; cellIndex: number; frame: number; label: string; frameKind: string }) {
  const column = cellIndex % sheet.columns
  const row = Math.floor(cellIndex / sheet.columns)
  const rows = Math.ceil(sheet.frameCount / sheet.columns)
  const sheetWidth = sheet.frameWidth * sheet.columns
  const sheetHeight = sheet.frameHeight * rows

  return (
    <svg className="visual-player__sprite" viewBox={`0 0 ${sheet.frameWidth} ${sheet.frameHeight}`} role="img" aria-label={`${label}, ${frameKind} ${frame}`}>
      <image href={localMediaUrl(sheet.src)} width={sheetWidth} height={sheetHeight} x={-column * sheet.frameWidth} y={-row * sheet.frameHeight} preserveAspectRatio="none" />
    </svg>
  )
}

function cellForTimelineFrame(sheet: VisualSpriteSheet | undefined, frame: number): number {
  if (!sheet) return -1
  const heldCell = sheet.gameFrameCells?.[frame - 1]
  if (typeof heldCell === 'number') return heldCell
  const numbers = sheet.frameNumbers ?? Array.from({ length: sheet.frameCount }, (_, index) => index + 1)
  return numbers.indexOf(frame)
}

export function MoveFrameViewer({ fighterId, fighterName, move }: { fighterId: string; fighterName: string; move: FrameMove }) {
  const [media, setMedia] = useState<VisualMoveMedia>()
  const [mediaLoading, setMediaLoading] = useState(true)
  const [mediaFailed, setMediaFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMedia(undefined)
    setMediaLoading(true)
    setMediaFailed(false)
    void loadVisualMediaForFighter(fighterId)
      .then((index) => {
        if (cancelled) return
        setMedia(index.get(move.id))
        setMediaLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setMediaFailed(true)
        setMediaLoading(false)
      })
    return () => { cancelled = true }
  }, [fighterId, move.id])

  const variants = media?.variants ?? []
  const firstVariantId = variants[0]?.id ?? ''
  const [variantId, setVariantId] = useState(firstVariantId)
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants[0]
  const selectedSheet = selectedVariant?.spriteSheet ?? (variants.length === 0 ? media?.spriteSheet : undefined)
  const selectedAnimationSrc = selectedVariant?.animationSrc
  const staticImageSrc = selectedVariant?.imageSrc
  const timelineClass = selectedVariant?.timelineClass ?? 'fighter-action'
  const usesParentActionTimeline = timelineClass === 'fighter-action'
  const isSynthetic = selectedVariant?.sourceFormat === 'synthetic-illustrative'
  const isSourceAnimation = timelineClass === 'source-animation'
  const isRelatedSource = selectedVariant?.mappingMethod === 'runtime-related-source-alias-not-coverage-evidence'

  const moveActiveStart = firstFrame(move.active)
  const moveActiveEnd = lastFrame(move.active)
  const activeStart = usesParentActionTimeline ? moveActiveStart : null
  const activeEnd = usesParentActionTimeline ? moveActiveEnd : null
  const parentTotal = numericValue(move.totalFrames) ?? media?.totalFrames ?? moveActiveEnd ?? move.startupFrame ?? 1
  const total = selectedVariant?.timelineTotalFrames ?? parentTotal
  const initial = usesParentActionTimeline ? Math.min(total, Math.max(1, move.startupFrame ?? 1)) : 1

  const [frame, setFrame] = useState(initial)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const [loopActive, setLoopActive] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    setFrame(initial)
    setPlaying(false)
    setPreviewFailed(false)
    setVariantId(firstVariantId)
  }, [firstVariantId, initial, move.id])

  useEffect(() => {
    if (!playing) return
    const delay = 1000 / (60 * speed)
    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (loopActive && activeStart !== null && activeEnd !== null) {
          if (current < activeStart || current >= activeEnd) return activeStart
          return current + 1
        }
        if (current >= total) {
          setPlaying(false)
          return total
        }
        return current + 1
      })
    }, delay)
    return () => window.clearInterval(timer)
  }, [activeEnd, activeStart, loopActive, playing, speed, total])

  useEffect(() => {
    setFrame((current) => Math.max(1, Math.min(total, current)))
    if (!usesParentActionTimeline) setLoopActive(false)
  }, [total, usesParentActionTimeline])

  const currentFrame = usesParentActionTimeline ? media?.frames.find((item) => item.frame === frame) : undefined
  const phase: VisualFramePhase = timelineClass === 'landing'
    ? 'landing'
    : usesParentActionTimeline
      ? currentFrame?.phase ?? fallbackPhase(frame, activeStart, activeEnd)
      : 'other'
  const regions = currentFrame?.regions ?? []
  const hasHostedStill = Boolean(currentFrame?.imageSrc)
  const sheetCellIndex = cellForTimelineFrame(selectedSheet, frame)
  const hasSpriteFrame = Boolean(selectedSheet && sheetCellIndex >= 0)
  const hasFrameVisual = hasHostedStill || hasSpriteFrame
  const hasExactVisual = hasFrameVisual && !isSynthetic && !isSourceAnimation && !isRelatedSource
  const hasStaticVisual = Boolean(staticImageSrc)
  const hasOverlayData = !isSynthetic && usesParentActionTimeline && Boolean(media?.frames.some((item) => {
    const exactImageAvailable = Boolean(item.imageSrc || cellForTimelineFrame(selectedSheet, item.frame) >= 0)
    return (item.regions?.length ?? 0) > 0 && exactImageAvailable
  }))
  const fighterRender = officialFighterRenderUrl(fighterId)
  const canLoopActive = activeStart !== null && activeEnd !== null

  const timing = useMemo(() => ({
    startup: usesParentActionTimeline ? move.startup ?? '—' : 'independent',
    active: usesParentActionTimeline ? move.active ?? '—' : 'independent',
    total: usesParentActionTimeline ? move.totalFrames ?? String(total) : String(total),
    landing: timelineClass === 'landing' ? String(total) : move.landingLag ?? '—',
  }), [move.active, move.landingLag, move.startup, move.totalFrames, timelineClass, total, usesParentActionTimeline])

  function setSafeFrame(next: number) {
    setFrame(Math.max(1, Math.min(total, next)))
  }

  function jumpToActive(which: 'first' | 'last') {
    const target = which === 'first' ? activeStart : activeEnd
    if (target === null) return
    setPlaying(false)
    setSafeFrame(target)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLSelectElement) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault(); setPlaying(false); setSafeFrame(frame - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault(); setPlaying(false); setSafeFrame(frame + 1)
    } else if (event.key === ' ') {
      event.preventDefault(); setPlaying((value) => !value)
    } else if (event.key.toLowerCase() === 'a' && activeStart !== null) {
      event.preventDefault(); jumpToActive('first')
    }
  }

  const stageStyle = selectedSheet ? { aspectRatio: `${selectedSheet.frameWidth} / ${selectedSheet.frameHeight}` } : undefined
  const showAnimatedFallback = Boolean(selectedAnimationSrc && !previewFailed && !hasFrameVisual)
  const showLegacyAnimatedPreview = Boolean(media?.animatedPreviewUrl && !previewFailed && !selectedSheet && !selectedAnimationSrc && !hasStaticVisual)
  const spritePreviewLabel = isSynthetic
    ? 'Timing schematic · not gameplay footage'
    : isRelatedSource
      ? 'Related local source · target timing not proven'
      : isSourceAnimation
        ? 'Local source animation · source frame'
        : 'Source-backed timeline frame'
  const spriteFrameKind = isSynthetic ? 'illustrative timing frame' : isSourceAnimation || isRelatedSource ? 'source frame' : 'source-backed timeline frame'
  const exactCoverageLabel = selectedSheet
    ? isSynthetic
      ? `${total} documented timing frames · local schematic`
      : isRelatedSource
        ? `${selectedSheet.frameCount} related-source images · display only`
        : isSourceAnimation
          ? `${selectedSheet.frameCount} seekable source images · not game-frame aligned`
          : selectedVariant?.coverage === 'full'
            ? `${total} / ${total} exact timeline frames · ${selectedSheet.frameCount} source images`
            : selectedVariant?.coverage === 'source-timed'
              ? `${total} source-timed frames · ${selectedSheet.frameCount} source images`
              : `${selectedSheet.frameCount} source images`
    : selectedVariant?.coverage === 'exact-static'
      ? '1 exact static source state'
      : null
  const sourceStatus = mediaLoading ? 'Loading local visuals…' : mediaFailed ? 'Local visual index unavailable' : media ? null : 'Timing only'

  const coverageNote = isSynthetic
    ? `This is a fully local seekable timing schematic, not gameplay footage. It visualizes documented phases${phase === 'intangible' ? ', including this documented intangible frame,' : ''} without inventing fighter poses, hitboxes, or collision geometry.`
    : isRelatedSource
      ? `This locally vendored animation is from a clearly related move state. It is useful for visual study, but it is not evidence that this target substate has identical animation or SSBU-frame timing.`
      : isSourceAnimation
        ? `This locally vendored source animation is seekable one decoded source image at a time. Source GIF display delays are not treated as SSBU game-frame timing.`
        : selectedVariant?.coverage === 'full'
          ? `This ${timelineClass} visual is complete and frame-addressable. Encoded source holds are repeated only for the 60 FPS frames their source timing actually covers.`
          : selectedVariant?.coverage === 'source-timed'
            ? `This is an independent ${timelineClass} timeline. It follows the source animation's encoded durations and is intentionally not forced onto the parent attack's Total Frames.`
            : selectedVariant?.coverage === 'exact-static'
              ? `This ${timelineClass} source is a truthful static visual state rather than a fabricated animation.`
              : selectedVariant?.coverage === 'partial' && selectedAnimationSrc
                ? `Exact frame mapping is incomplete (${selectedVariant.coverageReason ?? 'source coverage is partial'}). Exact mapped frames stay synchronized; other frames show the local moving source animation as an explicitly unsynchronized reference.`
                : selectedVariant?.coverage === 'untimed-animation' && selectedAnimationSrc
                  ? `This source remains animated locally, but it cannot yet be aligned to a complete documented fighter-action timeline: ${selectedVariant.coverageReason ?? 'exact timing unavailable'}.`
                  : selectedVariant?.coverage === 'static'
                    ? `This source does not prove a complete moving ${timelineClass} timeline: ${selectedVariant.coverageReason ?? 'animated frame coverage unavailable'}. It remains on the factual source-coverage queue.`
                    : selectedSheet
                      ? `This same-origin sheet contains ${selectedSheet.frameCount} source images mapped only where timing is justified.`
                      : mediaLoading
                        ? 'Loading this fighter’s same-origin visual index…'
                        : media
                          ? 'This move is mapped to UFD, but complete source-backed visual timing is not available for this variant.'
                          : 'Timing remains available when UFD does not expose a matching move visual.'

  const stageMediaClass = hasFrameVisual
    ? hasExactVisual ? ' visual-player__stage--exact' : ' visual-player__stage--source'
    : hasStaticVisual || showAnimatedFallback || showLegacyAnimatedPreview
      ? ' visual-player__stage--source'
      : ' visual-player__stage--fighter'

  return (
    <section className="visual-media-card" aria-label={`${fighterName} ${move.name} visual frame player`}>
      <header className="visual-media-card__head">
        <div><span className="eyebrow">Full move visual</span><h4>{media?.label ?? `${fighterName} ${move.name}`}</h4><p>Every move has a local seekable visual: source-backed media where available, and clearly labeled timing schematics where no verified moving source exists.</p></div>
        {media ? <a className="visual-media-card__source" href={media.sourceUrl} target="_blank" rel="noreferrer">Source notes ↗</a> : <span className="visual-media-card__source">{sourceStatus}</span>}
      </header>
      <div className="visual-player" tabIndex={0} onKeyDown={onKeyDown}>
        <div className="visual-player__split">
          <div style={stageStyle} className={`visual-player__stage visual-player__stage--${phase}${stageMediaClass}`}>
            {hasHostedStill && currentFrame?.imageSrc ? <img src={localMediaUrl(currentFrame.imageSrc)} alt={`${fighterName} ${move.name}, frame ${frame}`} loading="lazy" decoding="async" />
              : hasSpriteFrame && selectedSheet ? <><SpriteFrame sheet={selectedSheet} cellIndex={sheetCellIndex} frame={frame} label={`${fighterName} ${move.name}`} frameKind={spriteFrameKind} /><span className="visual-player__preview-label">{spritePreviewLabel}</span></>
              : showAnimatedFallback && selectedAnimationSrc ? <><img src={localMediaUrl(selectedAnimationSrc)} alt={`${fighterName} ${move.name} local moving source reference`} loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} /><span className="visual-player__preview-label">Moving source reference · not frame-synced</span></>
              : hasStaticVisual && staticImageSrc ? <><img src={localMediaUrl(staticImageSrc)} alt={`${fighterName} ${move.name} static source reference`} loading="lazy" decoding="async" /><span className="visual-player__preview-label">Static source reference</span></>
              : showLegacyAnimatedPreview && media?.animatedPreviewUrl ? <><img src={localMediaUrl(media.animatedPreviewUrl)} alt={`${fighterName} ${move.name} local animated hitbox reference`} loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} /><span className="visual-player__preview-label">Local animation fallback</span></>
              : <><img className="visual-player__fighter-render" src={fighterRender} alt={`${fighterName} Super Smash Bros. Ultimate render`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} /><div className="visual-player__diagram"><strong>{frame}f</strong><span>{phase}</span><small>{mediaLoading ? 'Loading local visual index…' : media ? 'No local frame visual staged for this frame' : move.name}</small></div></>}
            <span className="visual-player__phase">{phase}</span>
            {showOverlay && hasExactVisual && regions.length > 0 && <div className="visual-player__overlay" aria-hidden="true">{regions.map((region) => <span key={region.id} className={`hitbox-circle hitbox-circle--${region.kind}`} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.radius * 2}%`, aspectRatio: '1' }} title={region.label} />)}</div>}
          </div>
          <aside className="visual-player__timing" aria-label="Current visual timing"><h5>Frame index</h5><dl><dt>Current</dt><dd>{frame}f</dd><dt>Phase</dt><dd>{phase}</dd><dt>Timeline</dt><dd>{timelineClass}</dd><dt>Startup</dt><dd>{timing.startup}</dd><dt>Active</dt><dd>{timing.active}</dd><dt>Total</dt><dd>{timing.total}</dd><dt>Landing</dt><dd>{timing.landing}</dd>{exactCoverageLabel && <><dt>Visual coverage</dt><dd>{exactCoverageLabel}</dd></>}</dl>{currentFrame?.caption && <p className="visual-player__note">{currentFrame.caption}</p>}</aside>
        </div>
        <div className="visual-player__controls" aria-label="Frame player controls">
          <button type="button" onClick={() => { setPlaying(false); setSafeFrame(frame - 1) }} aria-label="Previous frame">−1f</button>
          <button type="button" onClick={() => { if (frame >= total) setFrame(loopActive && activeStart !== null ? activeStart : 1); setPlaying((value) => !value) }} aria-label={playing ? 'Pause frame playback' : 'Play frames'}>{playing ? 'Ⅱ' : '▶'}</button>
          <input className="visual-player__seek" type="range" min="1" max={Math.max(2, total)} value={frame} onChange={(event) => { setPlaying(false); setSafeFrame(Number(event.target.value)) }} aria-label="Seek frame" />
          <label className="visual-player__frame-input"><span>Frame</span><input type="number" min="1" max={total} value={frame} onChange={(event) => { setPlaying(false); setSafeFrame(Number(event.target.value)) }} /></label>
          <span className="visual-player__readout">/ {total}f</span>
          <button type="button" onClick={() => { setPlaying(false); setSafeFrame(frame + 1) }} aria-label="Next frame">+1f</button>
        </div>
        <div className="visual-player__study-controls" aria-label="Frame study controls">
          {variants.length > 1 && <label><span>Visual</span><select value={selectedVariant?.id ?? ''} onChange={(event) => { setVariantId(event.target.value); setFrame(1); setPlaying(false); setPreviewFailed(false) }}>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label>}
          <label><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as PlaybackSpeed)}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option></select></label>
          <button type="button" disabled={activeStart === null} onClick={() => jumpToActive('first')}>First active</button>
          <button type="button" disabled={activeEnd === null} onClick={() => jumpToActive('last')}>Last active</button>
          <label className="visual-player__loop-toggle"><input type="checkbox" checked={loopActive} disabled={!canLoopActive} onChange={(event) => { setLoopActive(event.target.checked); if (event.target.checked && activeStart !== null) setFrame(activeStart) }} /> Loop active span</label>
          {hasOverlayData ? <label className="visual-player__overlay-toggle"><input type="checkbox" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} /> Hitboxes</label> : <span className="visual-player__overlay-status">{isSynthetic ? 'No hitboxes are invented for schematic-only visuals' : 'Source hitboxes are baked into these study images'}</span>}
        </div>
        <p className="visual-player__note">{coverageNote}</p>
      </div>
    </section>
  )
}
