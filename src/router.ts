import { useSyncExternalStore } from 'react'

export type AppRoute =
  | { page: 'roster' }
  | { page: 'fighter'; slug: string }
  | { page: 'moves'; slug: string }
  | { page: 'practice'; slug: string }
  | { page: 'drills' }
  | { page: 'tools' }
  | { page: 'pro-lab'; slug?: string }
  | { page: 'pro-review'; vodId: string }
  | { page: 'about' }
  | { page: 'not-found' }

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getHash() {
  return window.location.hash || '#/'
}

export function parseRoute(hash: string): AppRoute {
  const normalized = hash.replace(/^#/, '') || '/'
  if (normalized === '/' || normalized === '') return { page: 'roster' }
  if (normalized === '/drills') return { page: 'drills' }
  if (normalized === '/tools') return { page: 'tools' }
  if (normalized === '/pro-lab') return { page: 'pro-lab' }
  if (normalized === '/about') return { page: 'about' }
  const proReviewMatch = normalized.match(/^\/pro-lab\/review\/([^/]+)$/)
  if (proReviewMatch?.[1]) {
    try {
      return { page: 'pro-review', vodId: decodeURIComponent(proReviewMatch[1]) }
    } catch {
      return { page: 'not-found' }
    }
  }
  const proLabMatch = normalized.match(/^\/pro-lab\/([a-z0-9-]+)$/)
  if (proLabMatch?.[1]) return { page: 'pro-lab', slug: proLabMatch[1] }
  const movesMatch = normalized.match(/^\/fighter\/([a-z0-9-]+)\/moves$/)
  if (movesMatch?.[1]) return { page: 'moves', slug: movesMatch[1] }
  const fighterMatch = normalized.match(/^\/fighter\/([a-z0-9-]+)$/)
  if (fighterMatch?.[1]) return { page: 'fighter', slug: fighterMatch[1] }
  const practiceMatch = normalized.match(/^\/practice\/([a-z0-9-]+)$/)
  if (practiceMatch?.[1]) return { page: 'practice', slug: practiceMatch[1] }
  return { page: 'not-found' }
}

export function useRoute(): AppRoute {
  const hash = useSyncExternalStore(subscribe, getHash, () => '#/')
  return parseRoute(hash)
}

export function hrefFor(path: string) {
  return `#${path}`
}
