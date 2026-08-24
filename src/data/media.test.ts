import { describe, expect, it } from 'vitest'
import { embeddableMedia, mediaAssets, validateMediaAssets } from './media'

describe('media provenance', () => {
  it('ships only valid registered assets', () => expect(validateMediaAssets(mediaAssets)).toEqual([]))
  it('allows the current project-owned visual systems to be embedded', () => {
    expect(mediaAssets.every(embeddableMedia)).toBe(true)
  })
})
