import type { VisualFrame, VisualMoveMedia } from '../types'

function makeFrames(totalFrames: number, activeStart: number, activeEnd: number): readonly VisualFrame[] {
  return Array.from({ length: totalFrames }, (_, index) => {
    const frame = index + 1
    const phase = frame < activeStart ? 'startup' : frame <= activeEnd ? 'active' : 'recovery'
    return { frame, phase }
  })
}

export const visualMoveMedia = [
  {
    id: 'mario-neutral-air-ufd',
    fighterId: 'mario',
    moveId: 'neutral-air',
    label: 'Mario Neutral Air',
    sourceUrl: 'https://ultimateframedata.com/mario',
    animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/mario/MarioNAir.gif',
    totalFrames: 45,
    frames: makeFrames(45, 3, 27),
  },
  {
    id: 'pyra-neutral-air-ufd',
    fighterId: 'pyra',
    moveId: 'neutral-air',
    label: 'Pyra Neutral Air',
    sourceUrl: 'https://ultimateframedata.com/pyra',
    animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/Pyra/PyraNAir.gif',
    totalFrames: 56,
    frames: makeFrames(56, 11, 22),
  },
  {
    id: 'mythra-neutral-air-ufd',
    fighterId: 'mythra',
    moveId: 'neutral-air',
    label: 'Mythra Neutral Air',
    sourceUrl: 'https://ultimateframedata.com/mythra',
    animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/Mythra/MythraNAir.gif',
    totalFrames: 50,
    frames: makeFrames(50, 8, 19),
  },
  {
    id: 'kazuya-neutral-air-ufd', fighterId: 'kazuya', moveId: 'neutral-air', label: 'Kazuya Neutral Air', sourceUrl: 'https://ultimateframedata.com/kazuya', animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4NAir.gif', totalFrames: 28, frames: makeFrames(28, 8, 16),
  },
  {
    id: 'kazuya-forward-air-ufd', fighterId: 'kazuya', moveId: 'forward-air', label: 'Kazuya Forward Air', sourceUrl: 'https://ultimateframedata.com/kazuya', animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4FAir.gif', totalFrames: 30, frames: makeFrames(30, 8, 14),
  },
  {
    id: 'kazuya-back-air-ufd', fighterId: 'kazuya', moveId: 'back-air', label: 'Kazuya Back Air', sourceUrl: 'https://ultimateframedata.com/kazuya', animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4BAir.gif', totalFrames: 45, frames: makeFrames(45, 11, 18),
  },
  {
    id: 'kazuya-up-air-ufd', fighterId: 'kazuya', moveId: 'up-air', label: 'Kazuya Up Air', sourceUrl: 'https://ultimateframedata.com/kazuya', animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4UAir.gif', totalFrames: 33, frames: makeFrames(33, 4, 9),
  },
  {
    id: 'kazuya-down-air-ufd', fighterId: 'kazuya', moveId: 'down-air', label: 'Kazuya Down Air', sourceUrl: 'https://ultimateframedata.com/kazuya', animatedPreviewUrl: 'https://ultimateframedata.com/hitboxes/kazuya/Shoto4DAir.gif', totalFrames: 57, frames: makeFrames(57, 17, 39),
  },
] as const satisfies readonly VisualMoveMedia[]

export const visualMediaByMove = new Map<string, VisualMoveMedia>(
  visualMoveMedia.map((media) => [`${media.fighterId}:${media.moveId}`, media] as const),
)

export function getVisualMoveMedia(fighterId: string, moveId: string): VisualMoveMedia | undefined {
  return visualMediaByMove.get(`${fighterId}:${moveId}`)
}
