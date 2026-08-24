import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { getVisualMoveMedia } from '../data/visualMedia'
import type { FrameMove, VisualFramePhase } from '../types'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import './MoveFrameViewer.css'

function fallbackPhase(frame: number, activeStart: number | null, activeEnd: number | null): VisualFramePhase {
  if (activeStart === null || activeEnd === null) return 'other'
  if (frame < activeStart) return 'startup'
  if (frame <= activeEnd) return 'active'
  return 'recovery'
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

  return (
    <section className="visual-media-card" aria-label={`${fighterName} ${move.name} visual frame player`}>
      <header className="visual-media-card__head">
        <div><span className="eyebrow">Frame-by-frame visual</span><h4>{media?.label ?? `${fighterName} ${move.name}`}</h4><p>Seek one game frame at a time. Overlay geometry is only drawn when that exact frame has annotation data.</p></div>
        {media ? <a className="visual-media-card__source" href={media.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a> : <span className="visual-media-card__source">Timing only</span>}
      </header>
      <div className="visual-player" tabIndex={0} onKeyDown={onKeyDown}>
        <div className="visual-player__split">
          <div className={`visual-player__stage${hasHostedStill ? '' : media?.animatedPreviewUrl ? '' : ' visual-player__stage--diagram'}`}>
            {hasHostedStill && currentFrame?.imageSrc ? (
              <img src={currentFrame.imageSrc} alt={`${fighterName} ${move.name}, frame ${frame}`} loading="lazy" decoding="async" />
            ) : media?.animatedPreviewUrl ? (
              <>
                <img src={media.animatedPreviewUrl} alt={`${fighterName} ${move.name} animated hitbox reference`} loading="lazy" decoding="async" />
                <span className="visual-player__preview-label">Animated source preview</span>
              </>
            ) : (
              <div className="visual-player__diagram"><strong>{frame}f</strong><span>{phase}</span><small>{fighterName} · {move.name}</small></div>
            )}
            <span className="visual-player__phase">{phase}</span>
            {showOverlay && hasHostedStill && regions.length > 0 && <div className="visual-player__overlay" aria-hidden="true">{regions.map((region) => <span key={region.id} className={`hitbox-circle hitbox-circle--${region.kind}`} style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.radius * 2}%`, aspectRatio: '1' }} title={region.label} />)}</div>}
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
        <p className="visual-player__note">{hasHostedStill ? 'This frame uses a hosted still and its overlay can be independently toggled.' : media?.animatedPreviewUrl ? 'The source GIF is a real hitbox reference but is not seek-synchronized. The controls index the documented game frames; locally hosted still sequences will replace the preview per frame as they are added.' : 'No visual media is staged for this move yet. The player still indexes the documented timing without inventing a hitbox image.'}</p>
      </div>
    </section>
  )
}
