import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { officialFighterRenderUrl } from '../data/officialFighterAssets'
import { getVisualMoveMedia } from '../data/visualMedia'
import type { FrameMove, VisualFramePhase, VisualSpriteSheet } from '../types'
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

function SpriteFrame({ sheet, frame, label }: { sheet: VisualSpriteSheet; frame: number; label: string }) {
  const index = frame - 1
  const column = index % sheet.columns
  const row = Math.floor(index / sheet.columns)
  const rows = Math.ceil(sheet.frameCount / sheet.columns)
  const sheetWidth = sheet.frameWidth * sheet.columns
  const sheetHeight = sheet.frameHeight * rows

  return (
    <svg className="visual-player__sprite" viewBox={`0 0 ${sheet.frameWidth} ${sheet.frameHeight}`} role="img" aria-label={`${label}, exact source frame ${frame}`}>
      <image
        href={localMediaUrl(sheet.src)}
        width={sheetWidth}
        height={sheetHeight}
        x={-column * sheet.frameWidth}
        y={-row * sheet.frameHeight}
        preserveAspectRatio="none"
      />
    </svg>
  )
}

export function MoveFrameViewer({ fighterId, fighterName, move }: { fighterId: string; fighterName: string; move: FrameMove }) {
  const media = getVisualMoveMedia(fighterId, move.id)
  const activeStart = firstFrame(move.active)
  const activeEnd = lastFrame(move.active)
  const total = media?.totalFrames ?? numericValue(move.totalFrames) ?? activeEnd ?? move.startupFrame ?? 1
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
  }, [initial, move.id])

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
  const hasSpriteFrame = Boolean(media?.spriteSheet && frame <= media.spriteSheet.frameCount)
  const hasExactVisual = hasHostedStill || hasSpriteFrame
  const hasAnyExactMedia = Boolean(media?.spriteSheet || media?.frames.some((item) => item.imageSrc))
  const hasOverlayData = Boolean(media?.frames.some((item) => (item.regions?.length ?? 0) > 0 && (item.imageSrc || media.spriteSheet)))
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
      event.preventDefault()
      setPlaying(false)
      setSafeFrame(frame - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setPlaying(false)
      setSafeFrame(frame + 1)
    } else if (event.key === ' ') {
      event.preventDefault()
      setPlaying((value) => !value)
    } else if (event.key.toLowerCase() === 'a' && activeStart !== null) {
      event.preventDefault()
      jumpToActive('first')
    }
  }

  const stageStyle = media?.spriteSheet ? { aspectRatio: `${media.spriteSheet.frameWidth} / ${media.spriteSheet.frameHeight}` } : undefined
  const showAnimatedPreview = Boolean(!hasAnyExactMedia && media?.animatedPreviewUrl && !previewFailed)
  const sourceFrameMissing = Boolean(media?.spriteSheet && frame > media.spriteSheet.frameCount)

  return (
    <section className="visual-media-card" aria-label={`${fighterName} ${move.name} visual frame player`}>
      <header className="visual-media-card__head">
        <div><span className="eyebrow">Frame-by-frame visual</span><h4>{media?.label ?? `${fighterName} ${move.name}`}</h4><p>Seek one documented game frame at a time. Exact source imagery is shown only for frame indices the staged source actually contains.</p></div>
        {media ? <a className="visual-media-card__source" href={media.sourceUrl} target="_blank" rel="noreferrer">Source notes ↗</a> : <span className="visual-media-card__source">Timing only</span>}
      </header>
      <div className="visual-player" tabIndex={0} onKeyDown={onKeyDown}>
        <div className="visual-player__split">
          <div style={stageStyle} className={`visual-player__stage visual-player__stage--${phase}${hasExactVisual ? ' visual-player__stage--exact' : showAnimatedPreview ? ' visual-player__stage--source' : ' visual-player__stage--fighter'}`}>
            {hasHostedStill && currentFrame?.imageSrc ? (
              <img src={localMediaUrl(currentFrame.imageSrc)} alt={`${fighterName} ${move.name}, frame ${frame}`} loading="lazy" decoding="async" />
            ) : hasSpriteFrame && media?.spriteSheet ? (
              <>
                <SpriteFrame sheet={media.spriteSheet} frame={frame} label={`${fighterName} ${move.name}`} />
                <span className="visual-player__preview-label">Exact local source frame</span>
              </>
            ) : showAnimatedPreview && media?.animatedPreviewUrl ? (
              <>
                <img src={localMediaUrl(media.animatedPreviewUrl)} alt={`${fighterName} ${move.name} local animated hitbox reference`} loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} />
                <span className="visual-player__preview-label">Local animation fallback</span>
              </>
            ) : (
              <>
                <img className="visual-player__fighter-render" src={fighterRender} alt={`${fighterName} Super Smash Bros. Ultimate render`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} />
                <div className="visual-player__diagram"><strong>{frame}f</strong><span>{phase}</span><small>{sourceFrameMissing ? 'Source visual unavailable for this frame' : move.name}</small></div>
              </>
            )}
            <span className="visual-player__phase">{phase}</span>
            {showOverlay && hasExactVisual && regions.length > 0 && <div className="visual-player__overlay" aria-hidden="true">{regions.map((region) => <span key={region.id} className={`hitbox-circle hitbox-circle--${region.kind}`} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.radius * 2}%`, aspectRatio: '1' }} title={region.label} />)}</div>}
          </div>
          <aside className="visual-player__timing" aria-label="Current move timing">
            <h5>Frame index</h5>
            <dl><dt>Current</dt><dd>{frame}f</dd><dt>Phase</dt><dd>{phase}</dd><dt>Startup</dt><dd>{timing.startup}</dd><dt>Active</dt><dd>{timing.active}</dd><dt>Total</dt><dd>{timing.total}</dd><dt>Landing</dt><dd>{timing.landing}</dd>{media?.spriteSheet && <><dt>Visual coverage</dt><dd>{media.spriteSheet.frameCount}/{total}f</dd></>}</dl>
            {currentFrame?.caption && <p className="visual-player__note">{currentFrame.caption}</p>}
          </aside>
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
          <label><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as PlaybackSpeed)}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option></select></label>
          <button type="button" disabled={activeStart === null} onClick={() => jumpToActive('first')}>First active</button>
          <button type="button" disabled={activeEnd === null} onClick={() => jumpToActive('last')}>Last active</button>
          <label className="visual-player__loop-toggle"><input type="checkbox" checked={loopActive} disabled={!canLoopActive} onChange={(event) => { setLoopActive(event.target.checked); if (event.target.checked && activeStart !== null) setFrame(activeStart) }} /> Loop active span</label>
          {hasOverlayData ? <label className="visual-player__overlay-toggle"><input type="checkbox" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} /> Hitboxes</label> : <span className="visual-player__overlay-status">Overlay metadata not staged</span>}
        </div>
        <p className="visual-player__note">{hasExactVisual ? 'This slider position selects the corresponding local source frame. Playback, slow motion, and active-span looping stay synchronized to the documented frame index.' : sourceFrameMissing ? 'The source animation does not contain a distinct image block for this documented recovery frame, so no visual is fabricated.' : showAnimatedPreview ? 'The local GIF is a fallback preview only; the timing controls are independent until an exact local frame sheet is staged.' : 'A local fighter render is shown while the controls index documented timing. No third-party asset request is made.'}</p>
      </div>
    </section>
  )
}
