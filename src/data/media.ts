import type { MediaAsset } from '../types'

/**
 * Bundled media must be registered here. Third-party references that have not
 * completed a rights review stay source-link-only and do not receive `src`.
 */
export const mediaAssets = [
  {
    id: 'procedural-fighter-glyphs',
    label: 'Procedural fighter identity glyph system',
    kind: 'diagram',
    status: 'project-owned',
    attribution: 'SSBU Training Guide project',
    license: 'Project-owned source code; generated at runtime.',
  },
  {
    id: 'abstract-frame-timeline',
    label: 'Abstract startup / active / recovery timeline',
    kind: 'diagram',
    status: 'project-owned',
    attribution: 'SSBU Training Guide project',
    license: 'Project-owned source code; generated at runtime.',
  },
] as const satisfies readonly MediaAsset[]

export function embeddableMedia(asset: MediaAsset): boolean {
  return asset.status === 'project-owned' || asset.status === 'explicitly-licensed'
}

export function validateMediaAssets(assets: readonly MediaAsset[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const asset of assets) {
    if (ids.has(asset.id)) errors.push(`Duplicate media asset id: ${asset.id}`)
    ids.add(asset.id)
    if (asset.status === 'explicitly-licensed' && (!asset.sourceUrl || !asset.license)) {
      errors.push(`${asset.id} needs a source URL and license before it can be embedded`)
    }
    if (asset.status === 'source-link-only' && asset.src) {
      errors.push(`${asset.id} is source-link-only and cannot define an embedded src`)
    }
  }
  return errors
}
