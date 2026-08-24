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
] as const satisfies readonly VisualMoveMedia[]

export const visualMediaByMove = new Map<string, VisualMoveMedia>(
  visualMoveMedia.map((media) => [`${media.fighterId}:${media.moveId}`, media]),
)

export function getVisualMoveMedia(fighterId: string, moveId: string): VisualMoveMedia | undefined {
  return visualMediaByMove.get(`${fighterId}:${moveId}`)
}
