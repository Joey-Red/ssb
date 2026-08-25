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

function SpriteFrame({ sheet, cellIndex, frame, label }: { sheet: VisualSpriteSheet; cellIndex: number; frame: number; label: string }) {
  const column = cellIndex % sheet.columns
  const row = Math.floor(cellIndex / sheet.columns)
  const rows = Math.ceil(sheet.frameCount / sheet.columns)
  const sheetWidth = sheet.frameWidth * sheet.columns
  const sheetHeight = sheet.frameHeight * rows

  return (
    <svg className="visual-player__sprite" viewBox={`0 0 ${sheet.frameWidth} ${sheet.frameHeight}`} role="img" aria-label={`${label}, exact source frame ${frame}`}>
      <image href={localMediaUrl(sheet.src)} width={sheetWidth} height={sheetHeight} x={-column * sheet.frameWidth} y={-row * sheet.frameHeight} preserveAspectRatio="none" />
    </svg>
  )
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
  const sheetFrameNumbers = selectedSheet?.frameNumbers ?? (selectedSheet ? Array.from({ length: selectedSheet.frameCount }, (_, index) => index + 1) : [])

  const activeStart = firstFrame(move.active)
  const activeEnd = lastFrame(move.active)
  const total = numericValue(move.totalFrames) ?? media?.totalFrames ?? activeEnd ?? move.startupFrame ?? 1
  const initial = Math.min(total, Math.max(1, move.startupFrame ?? 1))
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

  const currentFrame = media?.frames.find((item) => item.frame === frame)
  const phase = currentFrame?.phase ?? fallbackPhase(frame, activeStart, activeEnd)
  const regions = currentFrame?.regions ?? []
  const hasHostedStill = Boolean(currentFrame?.imageSrc)
  const sheetCellIndex = sheetFrameNumbers.indexOf(frame)
  const hasSpriteFrame = Boolean(selectedSheet && sheetCellIndex >= 0)
  const hasExactVisual = hasHostedStill || hasSpriteFrame
  const hasStaticVisual = Boolean(staticImageSrc)
  const hasOverlayData = Boolean(media?.frames.some((item) => {
    const mappedIndex = selectedSheet?.frameNumbers?.indexOf(item.frame) ?? -1
    const exactImageAvailable = Boolean(item.imageSrc || (selectedSheet && (selectedSheet.frameNumbers ? mappedIndex >= 0 : item.frame <= selectedSheet.frameCount)))
    return (item.regions?.length ?? 0) > 0 && exactImageAvailable
  }))
  const fighterRender = officialFighterRenderUrl(fighterId)
  const canLoopActive = activeStart !== null && activeEnd !== null

  const timing = useMemo(() => ({
    startup: move.startup ?? '—',
    active: move.active ?? '—',
    total: move.totalFrames ?? String(total),
    landing: move.landingLag ?? '—',
  }), [move.active, move.landingLag, move.startup, move.totalFrames, total])

  if (total < 2) return null

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
  const showAnimatedFallback = Boolean(selectedAnimationSrc && !previewFailed && !hasExactVisual)
  const showLegacyAnimatedPreview = Boolean(media?.animatedPreviewUrl && !previewFailed && !selectedSheet && !selectedAnimationSrc && !hasStaticVisual)
  const exactCoverageLabel = selectedSheet
    ? selectedVariant?.coverage === 'full'
      ? `${selectedSheet.frameCount} / ${total} exact frames`
      : `${selectedSheet.frameCount} exact mapped frames`
    : null
  const sourceStatus = mediaLoading ? 'Loading local visuals…' : mediaFailed ? 'Local visual index unavailable' : media ? null : 'Timing only'

  const coverageNote = selectedVariant?.coverage === 'full'
    ? 'This same-origin visual contains an exact source image for every documented game frame, so startup, active, and recovery all scrub and play continuously.'
    : selectedVariant?.coverage === 'partial' && selectedAnimationSrc
      ? `Exact frame mapping is incomplete (${selectedVariant.coverageReason ?? 'source coverage is partial'}). Exact mapped frames stay synchronized; other frames show the local moving source animation as an explicitly unsynchronized reference.`
      : selectedVariant?.coverage === 'untimed-animation' && selectedAnimationSrc
        ? `This source remains animated locally, but it cannot be aligned to a complete documented game-frame timeline: ${selectedVariant.coverageReason ?? 'exact timing unavailable'}.`
        : selectedVariant?.coverage === 'static'
          ? `This source is inherently static or separately timed: ${selectedVariant.coverageReason ?? 'animated frame coverage unavailable'}. It remains on the generated coverage-gap list.`
          : selectedSheet
            ? `This same-origin sheet contains ${selectedSheet.frameCount} exact source images mapped to documented game frames. Frames outside that exact set are never fabricated.`
            : mediaLoading
              ? 'Loading this fighter’s same-origin visual index…'
              : media
                ? 'This move is mapped to UFD, but exact full-motion source coverage is not available for this variant.'
                : 'Timing remains available when UFD does not expose a matching move visual.'

  return (
    <section className="visual-media-card" aria-label={`${fighterName} ${move.name} visual frame player`}>
      <header className="visual-media-card__head">
        <div><span className="eyebrow">Full move visual</span><h4>{media?.label ?? `${fighterName} ${move.name}`}</h4><p>Seek startup, active, and recovery game frames. Full-source variants animate continuously across the complete documented move; incomplete sources stay clearly labeled rather than receiving invented mappings.</p></div>
        {media ? <a className="visual-media-card__source" href={media.sourceUrl} target="_blank" rel="noreferrer">Source notes ↗</a> : <span className="visual-media-card__source">{sourceStatus}</span>}
      </header>
      <div className="visual-player" tabIndex={0} onKeyDown={onKeyDown}>
        <div className="visual-player__split">
          <div style={stageStyle} className={`visual-player__stage visual-player__stage--${phase}${hasExactVisual ? ' visual-player__stage--exact' : hasStaticVisual || showAnimatedFallback || showLegacyAnimatedPreview ? ' visual-player__stage--source' : ' visual-player__stage--fighter'}`}>
            {hasHostedStill && currentFrame?.imageSrc ? <img src={localMediaUrl(currentFrame.imageSrc)} alt={`${fighterName} ${move.name}, frame ${frame}`} loading="lazy" decoding="async" />
              : hasSpriteFrame && selectedSheet ? <><SpriteFrame sheet={selectedSheet} cellIndex={sheetCellIndex} frame={frame} label={`${fighterName} ${move.name}`} /><span className="visual-player__preview-label">Exact local source frame</span></>
              : showAnimatedFallback && selectedAnimationSrc ? <><img src={localMediaUrl(selectedAnimationSrc)} alt={`${fighterName} ${move.name} local moving source reference`} loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} /><span className="visual-player__preview-label">Moving source reference · not frame-synced</span></>
              : hasStaticVisual && staticImageSrc ? <><img src={localMediaUrl(staticImageSrc)} alt={`${fighterName} ${move.name} static hitbox reference`} loading="lazy" decoding="async" /><span className="visual-player__preview-label">Static source reference · coverage gap</span></>
              : showLegacyAnimatedPreview && media?.animatedPreviewUrl ? <><img src={localMediaUrl(media.animatedPreviewUrl)} alt={`${fighterName} ${move.name} local animated hitbox reference`} loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} /><span className="visual-player__preview-label">Local animation fallback</span></>
              : <><img className="visual-player__fighter-render" src={fighterRender} alt={`${fighterName} Super Smash Bros. Ultimate render`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} /><div className="visual-player__diagram"><strong>{frame}f</strong><span>{phase}</span><small>{mediaLoading ? 'Loading local visual index…' : media ? 'No exact or animated source visual staged for this frame' : move.name}</small></div></>}
            <span className="visual-player__phase">{phase}</span>
            {showOverlay && hasExactVisual && regions.length > 0 && <div className="visual-player__overlay" aria-hidden="true">{regions.map((region) => <span key={region.id} className={`hitbox-circle hitbox-circle--${region.kind}`} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.radius * 2}%`, aspectRatio: '1' }} title={region.label} />)}</div>}
          </div>
          <aside className="visual-player__timing" aria-label="Current move timing"><h5>Frame index</h5><dl><dt>Current</dt><dd>{frame}f</dd><dt>Phase</dt><dd>{phase}</dd><dt>Startup</dt><dd>{timing.startup}</dd><dt>Active</dt><dd>{timing.active}</dd><dt>Total</dt><dd>{timing.total}</dd><dt>Landing</dt><dd>{timing.landing}</dd>{exactCoverageLabel && <><dt>Visual coverage</dt><dd>{exactCoverageLabel}</dd></>}</dl>{currentFrame?.caption && <p className="visual-player__note">{currentFrame.caption}</p>}</aside>
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
          {variants.length > 1 && <label><span>Visual</span><select value={selectedVariant?.id ?? ''} onChange={(event) => { setVariantId(event.target.value); setPlaying(false); setPreviewFailed(false) }}>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label>}
          <label><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as PlaybackSpeed)}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option></select></label>
          <button type="button" disabled={activeStart === null} onClick={() => jumpToActive('first')}>First active</button>
          <button type="button" disabled={activeEnd === null} onClick={() => jumpToActive('last')}>Last active</button>
          <label className="visual-player__loop-toggle"><input type="checkbox" checked={loopActive} disabled={!canLoopActive} onChange={(event) => { setLoopActive(event.target.checked); if (event.target.checked && activeStart !== null) setFrame(activeStart) }} /> Loop active span</label>
          {hasOverlayData ? <label className="visual-player__overlay-toggle"><input type="checkbox" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} /> Hitboxes</label> : <span className="visual-player__overlay-status">Source hitboxes are baked into these study images</span>}
        </div>
        <p className="visual-player__note">{coverageNote}</p>
      </div>
    </section>
  )
}
