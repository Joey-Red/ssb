import assetManifestJson from './visualMediaAssets.generated.json'
import sourceManifestJson from './visualMediaSources.json'
import type { VisualMediaVariant, VisualMoveMedia, VisualSpriteSheet } from '../types'

type SourceVariant = {
  id: string
  label: string
  downloadUrl: string
  mediaType: 'gif' | 'image'
}
type SourceMoveV2 = {
  fighterId: string
  moveId: string
  label: string
  sourceUrl: string
  totalFrames: number | null
  startupFrame: number | null
  active: string | null
  activeSpan: number[]
  variants: SourceVariant[]
}
type SourceManifestV2 = {
  version: 2
  fightersScanned: number
  mappedMoves: number
  mappedVariants: number
  moves: SourceMoveV2[]
}
type GeneratedV1Move = {
  previewSrc: string
  spriteSheet?: VisualSpriteSheet
}
type GeneratedV1 = {
  version: 1
  generatedAt: string | null
  moves: Record<string, GeneratedV1Move>
}
type GeneratedV2Variant = VisualMediaVariant & {
  sha256?: string
  sourceFrameCount?: number
}
type GeneratedV2Move = {
  variants: GeneratedV2Variant[]
}
type GeneratedV2 = {
  version: 2
  generatedAt: string | null
  moves: Record<string, GeneratedV2Move>
}

const sourceManifest = sourceManifestJson as SourceManifestV2
const assetManifest = assetManifestJson as GeneratedV1 | GeneratedV2

function stagedVariants(key: string, source: SourceMoveV2): readonly VisualMediaVariant[] {
  if (assetManifest.version === 2) {
    return assetManifest.moves[key]?.variants ?? []
  }
  const legacy = assetManifest.moves[key]
  if (!legacy) return []
  const label = source.variants[0]?.label ?? source.label
  return [{
    id: source.variants[0]?.id ?? 'default',
    label,
    ...(legacy.spriteSheet ? { spriteSheet: legacy.spriteSheet } : {}),
  }]
}

export const visualMoveMedia = sourceManifest.moves.map((source): VisualMoveMedia => {
  const key = `${source.fighterId}:${source.moveId}`
  const variants = stagedVariants(key, source)
  const primarySheet = variants.find((variant) => variant.spriteSheet)?.spriteSheet
  const fallbackTotal = source.activeSpan[1] ?? source.startupFrame ?? 1
  return {
    id: `${source.fighterId}-${source.moveId}-ufd`,
    fighterId: source.fighterId,
    moveId: source.moveId,
    label: source.label,
    sourceUrl: source.sourceUrl,
    ...(primarySheet ? { spriteSheet: primarySheet } : {}),
    ...(variants.length ? { variants } : {}),
    totalFrames: source.totalFrames ?? fallbackTotal,
    // No independent overlay geometry is staged for the discovered UFD media.
    // The player's authoritative phase/timing comes from FrameMove and exact
    // image cells are mapped by spriteSheet.frameNumbers.
    frames: [],
  }
})

export const visualMediaByMove = new Map<string, VisualMoveMedia>(
  visualMoveMedia.map((media) => [`${media.fighterId}:${media.moveId}`, media] as const),
)

export function getVisualMoveMedia(fighterId: string, moveId: string): VisualMoveMedia | undefined {
  return visualMediaByMove.get(`${fighterId}:${moveId}`)
}
