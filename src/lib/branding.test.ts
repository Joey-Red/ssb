import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const TEXT_EXTENSIONS = /\.(?:md|ts|tsx|css|html|json|yml|yaml|mjs|py)$/
const SKIP = new Set(['.git', 'node_modules', 'dist'])
const RETIRED_THEME_PATTERN = new RegExp(`\\b${['ti', 'tan'].join('')}\\b`, 'i')

function textFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    if (SKIP.has(name)) return []
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (path.includes(`${join('public', 'media')}`)) return []
      return textFiles(path)
    }
    if (basename(path) === 'package-lock.json') return []
    return TEXT_EXTENSIONS.test(name) ? [path] : []
  })
}

describe('theme branding', () => {
  it('uses Arena as the alternate theme name throughout maintained text', () => {
    const violations = textFiles(process.cwd()).filter((path) => RETIRED_THEME_PATTERN.test(readFileSync(path, 'utf8')))
    expect(violations).toEqual([])
  })
})
