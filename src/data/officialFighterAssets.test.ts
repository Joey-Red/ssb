import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { roster } from './roster'
import { officialFighterRenderUrl, officialFighterThumbUrl } from './officialFighterAssets'

describe('vendored fighter assets', () => {
  it('uses same-origin local paths for the full roster', () => {
    for (const fighter of roster) {
      const render = officialFighterRenderUrl(fighter.id)
      const thumb = officialFighterThumbUrl(fighter.id)
      expect(render).not.toMatch(/^https?:\/\//)
      expect(thumb).not.toMatch(/^https?:\/\//)
      expect(render).toContain(`media/fighters/renders/${fighter.id}.webp`)
      expect(thumb).toContain(`media/fighters/thumbs/${fighter.id}.webp`)
    }
  })

  it('ships a render and centered thumbnail for all 89 fighter pages', () => {
    expect(roster).toHaveLength(89)
    for (const fighter of roster) {
      expect(existsSync(join(process.cwd(), 'public', 'media', 'fighters', 'renders', `${fighter.id}.webp`)), `${fighter.id} render`).toBe(true)
      expect(existsSync(join(process.cwd(), 'public', 'media', 'fighters', 'thumbs', `${fighter.id}.webp`)), `${fighter.id} thumbnail`).toBe(true)
    }
  })
})
