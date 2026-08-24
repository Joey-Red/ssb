import type { FrameMove } from '../types'
import { firstFrame, isComplexActiveNotation, lastFrame, numericValue } from '../lib/frameData'
import './FrameTimeline.css'

export function FrameTimeline({ move }: { move: FrameMove }) {
  const startup = move.startupFrame ?? firstFrame(move.startup)
  const activeStart = firstFrame(move.active)
  const activeEnd = lastFrame(move.active)
  const total = numericValue(move.totalFrames)
  const canScale = startup !== null && activeStart !== null && activeEnd !== null && total !== null && total >= activeEnd
  const complex = isComplexActiveNotation(move.active)

  if (!canScale) {
    return (
      <div className="frame-timeline frame-timeline--fallback" aria-label={`${move.name} frame timeline`}>
        <span><b>Startup</b>{move.startup ?? '—'}</span>
        <span><b>Active</b>{move.active ?? '—'}</span>
        <span><b>Total / FAF</b>{move.totalFrames ?? '—'}</span>
      </div>
    )
  }

  const startupFrames = Math.max(0, activeStart - 1)
  const activeWindow = Math.max(1, activeEnd - activeStart + 1)
  const recoveryFrames = Math.max(0, total - activeEnd)
  const label = `${move.name}: startup through frame ${startupFrames}, active notation ${move.active}, total frames ${move.totalFrames}`

  return (
    <figure className="frame-timeline" aria-label={label}>
      <div className="frame-timeline__bar" style={{ gridTemplateColumns: `${startupFrames || 1}fr ${activeWindow}fr ${recoveryFrames || 1}fr` }}>
        <span className="frame-timeline__startup"><b>{startupFrames}f</b><small>startup</small></span>
        <span className="frame-timeline__active"><b>{activeWindow}f*</b><small>active span</small></span>
        <span className="frame-timeline__recovery"><b>{recoveryFrames}f</b><small>after last listed active frame</small></span>
      </div>
      <figcaption>
        <span>Active: <strong>{move.active}</strong></span>
        <span>Total / FAF: <strong>{move.totalFrames}</strong></span>
        {complex && <em>* Multi-hit/late notation is not treated as continuously active; use the raw Active value.</em>}
      </figcaption>
    </figure>
  )
}
