import assetManifestJson from './visualMediaAssets.generated.json'
import sourceManifestJson from './visualMediaSources.json'
import type { VisualFrame, VisualMoveMedia, VisualSpriteSheet } from '../types'

type FrameRange = readonly [start: number, end: number]
type SourceMove = {
  fighterId: string
  moveId: string
  label: string
  sourceUrl: string
  downloadUrl: string
  totalFrames: number
  activeRanges: number[][]
}
type GeneratedMoveAsset = {
  previewSrc: string
  spriteSheet?: VisualSpriteSheet
}
type GeneratedAssetManifest = {
  version: 1
  generatedAt: string | null
  moves: Record<string, GeneratedMoveAsset>
}

const sourceManifest = sourceManifestJson as { version: 1; moves: SourceMove[] }
const assetManifest = assetManifestJson as GeneratedAssetManifest

function makeFrames(totalFrames: number, activeRanges: readonly FrameRange[]): readonly VisualFrame[] {
  const firstActive = Math.min(...activeRanges.map(([start]) => start))
  return Array.from({ length: totalFrames }, (_, index) => {
    const frame = index + 1
    const isActive = activeRanges.some(([start, end]) => frame >= start && frame <= end)
    const phase = isActive ? 'active' : frame < firstActive ? 'startup' : 'recovery'
    return { frame, phase }
  })
}

export const visualMoveMedia = sourceManifest.moves.map((source): VisualMoveMedia => {
  const key = `${source.fighterId}:${source.moveId}`
  const staged = assetManifest.moves[key]
  const activeRanges = source.activeRanges.map(([start, end]) => [start, end] as FrameRange)
  return {
    id: `${source.fighterId}-${source.moveId}-ufd`,
    fighterId: source.fighterId,
    moveId: source.moveId,
    label: source.label,
    sourceUrl: source.sourceUrl,
    ...(staged?.previewSrc ? { animatedPreviewUrl: staged.previewSrc } : {}),
    ...(staged?.spriteSheet ? { spriteSheet: staged.spriteSheet } : {}),
    totalFrames: source.totalFrames,
    frames: makeFrames(source.totalFrames, activeRanges),
  }
})

export const visualMediaByMove = new Map<string, VisualMoveMedia>(
  visualMoveMedia.map((media) => [`${media.fighterId}:${media.moveId}`, media] as const),
)

export function getVisualMoveMedia(fighterId: string, moveId: string): VisualMoveMedia | undefined {
  return visualMediaByMove.get(`${fighterId}:${moveId}`)
}
