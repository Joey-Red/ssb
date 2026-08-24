import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { officialFighterRenderUrl } from '../data/officialFighterAssets'
import { getVisualMoveMedia } from '../data/visualMedia'
import type { FrameMove, VisualFramePhase, VisualSpriteSheet } from '../types'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import './MoveFrameViewer.css'

function fallbackPhase(frame: number, activeStart: number | null, activeEnd: number | null): VisualFramePhase {
  if (activeStart === null || activeEnd === null) return 'other'
  if (frame < activeStart) return 'startup'
  if (frame <= activeEnd) return 'active'
  return 'recovery'
}

function localMediaUrl(src: string): string {
  if (/^https?:\/\//.test(src)) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

function SpriteFrame({ sheet, frame, label, totalFrames }: { sheet: VisualSpriteSheet; frame: number; label: string; totalFrames: number }) {
  const index = frame - 1
  const column = index % sheet.columns
  const row = Math.floor(index / sheet.columns)
  const rows = Math.ceil(totalFrames / sheet.columns)
  const sheetWidth = sheet.frameWidth * sheet.columns
  const sheetHeight = sheet.frameHeight * rows

  return (
    <svg className="visual-player__sprite" viewBox={`0 0 ${sheet.frameWidth} ${sheet.frameHeight}`} role="img" aria-label={`${label}, exact frame ${frame}`}>
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
  const [showOverlay, setShowOverlay] = useState(true)

  useEffect(() => {
    setFrame(initial)
    setPlaying(false)
  }, [initial, move.id])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setFrame((current) => {
        if (current >= total) {
          setPlaying(false)
          return total
        }
        return current + 1
      })
    }, 1000 / 60)
    return () => window.clearInterval(timer)
  }, [playing, total])

  const currentFrame = media?.frames.find((item) => item.frame === frame)
  const phase = currentFrame?.phase ?? fallbackPhase(frame, activeStart, activeEnd)
  const regions = currentFrame?.regions ?? []
  const hasHostedStill = Boolean(currentFrame?.imageSrc)
  const hasSpriteSheet = Boolean(media?.spriteSheet)
  const hasExactVisual = hasHostedStill || hasSpriteSheet
  const fighterRender = officialFighterRenderUrl(fighterId)

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

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSafeFrame(frame - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSafeFrame(frame + 1)
    } else if (event.key === ' ') {
      event.preventDefault()
      setPlaying((value) => !value)
    }
  }

  const stageStyle = media?.spriteSheet ? { aspectRatio: `${media.spriteSheet.frameWidth} / ${media.spriteSheet.frameHeight}` } : undefined

  return (
    <section className="visual-media-card" aria-label={`${fighterName} ${move.name} visual frame player`}>
      <header className="visual-media-card__head">
        <div><span className="eyebrow">Frame-by-frame visual</span><h4>{media?.label ?? `${fighterName} ${move.name}`}</h4><p>Seek one game frame at a time. Exact hitbox geometry is only drawn when that frame has annotation data.</p></div>
        {media ? <a className="visual-media-card__source" href={media.sourceUrl} target="_blank" rel="noreferrer">Hitbox source ↗</a> : <span className="visual-media-card__source">Fighter visual + timing</span>}
      </header>
      <div className="visual-player" tabIndex={0} onKeyDown={onKeyDown}>
        <div className="visual-player__split">
          <div style={stageStyle} className={`visual-player__stage visual-player__stage--${phase}${hasExactVisual ? ' visual-player__stage--exact' : media?.animatedPreviewUrl ? ' visual-player__stage--source' : ' visual-player__stage--fighter'}`}>
            {hasHostedStill && currentFrame?.imageSrc ? (
              <img src={localMediaUrl(currentFrame.imageSrc)} alt={`${fighterName} ${move.name}, frame ${frame}`} loading="lazy" decoding="async" />
            ) : media?.spriteSheet ? (
              <>
                <SpriteFrame sheet={media.spriteSheet} frame={frame} label={`${fighterName} ${move.name}`} totalFrames={total} />
                <span className="visual-player__preview-label">Exact frame sheet</span>
              </>
            ) : media?.animatedPreviewUrl ? (
              <>
                <img src={media.animatedPreviewUrl} alt={`${fighterName} ${move.name} animated hitbox reference`} loading="lazy" decoding="async" />
                <span className="visual-player__preview-label">Real hitbox animation</span>
              </>
            ) : (
              <>
                <img className="visual-player__fighter-render" src={fighterRender} alt={`${fighterName} official Super Smash Bros. Ultimate render`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true }} />
                <div className="visual-player__diagram"><strong>{frame}f</strong><span>{phase}</span><small>{move.name}</small></div>
              </>
            )}
            <span className="visual-player__phase">{phase}</span>
            {showOverlay && hasExactVisual && regions.length > 0 && <div className="visual-player__overlay" aria-hidden="true">{regions.map((region) => <span key={region.id} className={`hitbox-circle hitbox-circle--${region.kind}`} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.radius * 2}%`, aspectRatio: '1' }} title={region.label} />)}</div>}
          </div>
          <aside className="visual-player__timing" aria-label="Current move timing">
            <h5>Frame index</h5>
            <dl><dt>Current</dt><dd>{frame}f</dd><dt>Phase</dt><dd>{phase}</dd><dt>Startup</dt><dd>{timing.startup}</dd><dt>Active</dt><dd>{timing.active}</dd><dt>Total</dt><dd>{timing.total}</dd><dt>Landing</dt><dd>{timing.landing}</dd></dl>
            {currentFrame?.caption && <p className="visual-player__note">{currentFrame.caption}</p>}
          </aside>
        </div>
        <div className="visual-player__controls" aria-label="Frame player controls">
          <button type="button" onClick={() => { setPlaying(false); setSafeFrame(frame - 1) }} aria-label="Previous frame">−1f</button>
          <button type="button" onClick={() => { if (frame >= total) setFrame(1); setPlaying((value) => !value) }} aria-label={playing ? 'Pause frame playback' : 'Play frames'}>{playing ? 'Ⅱ' : '▶'}</button>
          <input type="range" min="1" max={Math.max(2, total)} value={frame} onChange={(event) => { setPlaying(false); setSafeFrame(Number(event.target.value)) }} aria-label="Seek frame" />
          <span className="visual-player__readout">{frame} / {total}f</span>
          <button type="button" onClick={() => { setPlaying(false); setSafeFrame(frame + 1) }} aria-label="Next frame">+1f</button>
          <label className="visual-player__overlay-toggle"><input type="checkbox" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} /> Hitboxes</label>
        </div>
        <p className="visual-player__note">{hasExactVisual ? 'The slider is selecting an exact staged visual frame; annotations can be toggled independently.' : media?.animatedPreviewUrl ? 'This is the real source hitbox animation, but the GIF itself is not seek-synchronized. The frame controls index documented timing until an exact local frame sheet is staged.' : 'A real fighter render is shown while the controls index documented move timing. Exact hitbox geometry remains unavailable until move-specific visual media is staged.'}</p>
      </div>
    </section>
  )
}
