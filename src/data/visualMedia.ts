import type { VisualFrame, VisualMoveMedia } from '../types'

type FrameRange = readonly [start: number, end: number]

function makeFrames(totalFrames: number, activeRanges: readonly FrameRange[]): readonly VisualFrame[] {
  return Array.from({ length: totalFrames }, (_, index) => {
    const frame = index + 1
    const isActive = activeRanges.some(([start, end]) => frame >= start && frame <= end)
    const firstActive = Math.min(...activeRanges.map(([start]) => start))
    const phase = isActive ? 'active' : frame < firstActive ? 'startup' : 'recovery'
    return { frame, phase }
  })
}

function visual(
  fighterId: string,
  moveId: string,
  label: string,
  preview: string,
  totalFrames: number,
  activeRanges: readonly FrameRange[],
): VisualMoveMedia {
  return {
    id: `${fighterId}-${moveId}-ufd`,
    fighterId,
    moveId,
    label,
    sourceUrl: `https://ultimateframedata.com/${fighterId}`,
    animatedPreviewUrl: preview,
    totalFrames,
    frames: makeFrames(totalFrames, activeRanges),
  }
}

export const visualMoveMedia = [
  visual('mario', 'neutral-air', 'Mario Neutral Air', 'https://ultimateframedata.com/hitboxes/mario/MarioNAir.gif', 45, [[3, 27]]),
  visual('mario', 'forward-air', 'Mario Forward Air', 'https://ultimateframedata.com/hitboxes/mario/MarioFAir.gif', 59, [[16, 21]]),
  visual('mario', 'back-air', 'Mario Back Air', 'https://ultimateframedata.com/hitboxes/mario/MarioBAir.gif', 33, [[6, 10]]),
  visual('mario', 'up-air', 'Mario Up Air', 'https://ultimateframedata.com/hitboxes/mario/MarioUAir.gif', 30, [[4, 7]]),

  visual('pyra', 'neutral-air', 'Pyra Neutral Air', 'https://ultimateframedata.com/hitboxes/Pyra/PyraNAir.gif', 56, [[11, 22]]),
  visual('pyra', 'forward-air', 'Pyra Forward Air', 'https://ultimateframedata.com/hitboxes/Pyra/PyraFAir.gif', 48, [[11, 14]]),
  visual('pyra', 'back-air', 'Pyra Back Air', 'https://ultimateframedata.com/hitboxes/Pyra/PyraBAir.gif', 49, [[16, 18]]),
  visual('pyra', 'up-air', 'Pyra Up Air', 'https://ultimateframedata.com/hitboxes/Pyra/PyraUAir.gif', 57, [[13, 17]]),
  visual('pyra', 'down-air', 'Pyra Down Air', 'https://ultimateframedata.com/hitboxes/Pyra/PyraDAir.gif', 65, [[17, 20]]),

  visual('mythra', 'neutral-air', 'Mythra Neutral Air', 'https://ultimateframedata.com/hitboxes/Mythra/MythraNAir.gif', 50, [[8, 19]]),
  visual('mythra', 'forward-air', 'Mythra Forward Air', 'https://ultimateframedata.com/hitboxes/Mythra/MythraFAir.gif', 37, [[8, 11]]),
  visual('mythra', 'back-air', 'Mythra Back Air', 'https://ultimateframedata.com/hitboxes/Mythra/MythraBAir.gif', 33, [[10, 12]]),
  visual('mythra', 'up-air', 'Mythra Up Air', 'https://ultimateframedata.com/hitboxes/Mythra/MythraUAir.gif', 30, [[9, 13]]),
  visual('mythra', 'down-air', 'Mythra Down Air', 'https://ultimateframedata.com/hitboxes/Mythra/MythraDAir.gif', 40, [[13, 16]]),

  visual('kazuya', 'neutral-air', 'Kazuya Neutral Air', 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4NAir.gif', 28, [[8, 16]]),
  visual('kazuya', 'forward-air', 'Kazuya Forward Air', 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4FAir.gif', 30, [[8, 14]]),
  visual('kazuya', 'back-air', 'Kazuya Back Air', 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4BAir.gif', 45, [[11, 18]]),
  visual('kazuya', 'up-air', 'Kazuya Up Air', 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4UAir.gif', 33, [[4, 9]]),
  visual('kazuya', 'down-air', 'Kazuya Down Air', 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4DAir.gif', 57, [[17, 39]]),
] as const satisfies readonly VisualMoveMedia[]

export const visualMediaByMove = new Map<string, VisualMoveMedia>(
  visualMoveMedia.map((media) => [`${media.fighterId}:${media.moveId}`, media] as const),
)

export function getVisualMoveMedia(fighterId: string, moveId: string): VisualMoveMedia | undefined {
  return visualMediaByMove.get(`${fighterId}:${moveId}`)
}
