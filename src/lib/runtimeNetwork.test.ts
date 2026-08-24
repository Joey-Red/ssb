import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx|css)$/.test(name) ? [path] : []
  })
}

describe('runtime network policy', () => {
  it('does not embed third-party runtime asset or request URLs in app source', () => {
    const violations: string[] = []
    for (const path of sourceFiles(join(process.cwd(), 'src'))) {
      const text = readFileSync(path, 'utf8')
      const patterns = [
        /(?:src|poster)\s*=\s*["'{`][^\n]*https?:\/\//i,
        /url\(\s*["']?https?:\/\//i,
        /fetch\(\s*["'`]https?:\/\//i,
        /new\s+(?:WebSocket|EventSource)\s*\(\s*["'`]https?:\/\//i,
      ]
      if (patterns.some((pattern) => pattern.test(text))) violations.push(path)
    }
    expect(violations).toEqual([])
  })

  it('locks automatic browser resources and connections to the Pages origin', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain("img-src 'self' data: blob:")
    expect(html).toContain("media-src 'self'")
    expect(html).toContain("connect-src 'self'")
    expect(html).toContain("font-src 'self' data:")
  })
})
