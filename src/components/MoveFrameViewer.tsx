import { useEffect, useMemo, useState } from 'react'
import type { FrameMove } from '../types'
import { firstFrame, lastFrame, numericValue } from '../lib/frameData'
import { FighterGlyph } from './FighterGlyph'
import './MoveFrameViewer.css'

export function MoveFrameViewer({ fighterName, move }: { fighterName: string; move: FrameMove }) {
  const activeStart = firstFrame(move.active)
  const activeEnd = lastFrame(move.active)
  const total = numericValue(move.totalFrames) ?? activeEnd ?? move.startupFrame ?? 1
  const initial = Math.min(total, Math.max(1, move.startupFrame ?? 1))
  const [frame, setFrame] = useState(initial)

  useEffect(() => setFrame(initial), [initial, move.id])

  const phase = useMemo(() => {
    if (activeStart === null || activeEnd === null) return 'unknown'
    if (frame < activeStart) return 'startup'
    if (frame <= activeEnd) return 'listed active span'
    return 'recovery / post-active'
  }, [activeEnd, activeStart, frame])

  if (total < 2) return null

  return (
    <div className="move-frame-viewer">
      <div className="move-frame-viewer__head"><span><small>Frame scrubber</small><strong>Frame {frame} / {total}</strong></span><b>{phase}</b></div>
      <div className={`move-frame-viewer__stage phase-${phase.replace(/\W+/g, '-')}`}>
        <div className="move-frame-viewer__fighter"><FighterGlyph name={fighterName} compact /></div>
        <div className="move-frame-viewer__body" aria-hidden="true" />
        <div className="move-frame-viewer__hitbox-slot">
          <span>{phase === 'listed active span' ? 'Active-span frame' : 'No listed active span'}</span>
          <small>Hitbox geometry intentionally unavailable</small>
        </div>
      </div>
      <label className="move-frame-viewer__control"><span className="sr-only">Current frame</span><input type="range" min="1" max={Math.max(2, total)} value={frame} onChange={(event) => setFrame(Number(event.target.value))}/><span><b>1</b><b>{move.active ?? 'active unknown'}</b><b>{total}</b></span></label>
      <p>The phase display uses the first/last listed active frame only. Multi-hit gaps remain represented by the raw Active notation above. No collision or hitbox coordinates are invented.</p>
    </div>
  )
}
