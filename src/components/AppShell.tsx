import type { ReactNode } from 'react'
import { allGuides } from '../data/allGuides'
import { fighterBySlug, roster } from '../data/roster'
import { hrefFor, type AppRoute } from '../router'

export function AppShell({ route, children }: { route: AppRoute; children: ReactNode }) {
  const fighterName = route.page === 'fighter' || route.page === 'practice'
    ? fighterBySlug.get(route.slug)?.name
    : undefined

  const title = route.page === 'roster'
    ? 'Roster'
    : route.page === 'fighter'
      ? fighterName ?? 'Fighter'
      : route.page === 'practice'
        ? `${fighterName ?? 'Fighter'} Practice`
        : route.page === 'tools'
          ? 'Frame Tools'
          : route.page === 'about'
            ? 'About'
            : 'Not found'

  const subtitle = route.page === 'roster'
    ? 'Search, choose, practice'
    : route.page === 'fighter'
      ? 'Guide, routine, combos, frame data'
      : route.page === 'practice'
        ? 'Focused reps and progression'
        : route.page === 'tools'
          ? 'Compare moves and OOS startup'
          : 'Frame-literate training notes'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <a className="brand" href={hrefFor('/')}><span className="brand-mark" aria-hidden="true">S</span><span><strong>SSBU</strong><small>TRAINING GUIDE</small></span></a>
        <p className="nav-label">Workspace</p>
        <nav className="side-nav" aria-label="Primary">
          <a className={route.page === 'roster' ? 'is-active' : ''} href={hrefFor('/')}><span aria-hidden="true">▦</span><strong>Roster</strong><em>{roster.length}</em></a>
          <a className={route.page === 'fighter' ? 'is-active' : ''} href={hrefFor('/fighter/mario')}><span aria-hidden="true">◎</span><strong>Fighter guides</strong><em>{allGuides.length}</em></a>
          <a className={route.page === 'practice' ? 'is-active' : ''} href={hrefFor('/practice/mario')}><span aria-hidden="true">▶</span><strong>Practice</strong></a>
          <a className={route.page === 'tools' ? 'is-active' : ''} href={hrefFor('/tools')}><span aria-hidden="true">⌁</span><strong>Frame tools</strong></a>
          <a className={route.page === 'about' ? 'is-active' : ''} href={hrefFor('/about')}><span aria-hidden="true">?</span><strong>How to read it</strong></a>
        </nav>
        <div className="sidebar-footer"><span className="health-dot" aria-hidden="true"/><strong>Static & source-aware</strong><p>No server, login, telemetry, or runtime data dependency.</p></div>
      </aside>
      <div className="app-column">
        <header className="topbar"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="topbar-status"><span className="health-dot" aria-hidden="true"/><strong>Ready</strong><span>{allGuides.length}/{roster.length} guides</span></div></header>
        <main id="main-content" className="content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile primary">
        <a className={route.page === 'roster' ? 'is-active' : ''} href={hrefFor('/')}><span aria-hidden="true">▦</span><strong>Roster</strong></a>
        <a className={route.page === 'fighter' ? 'is-active' : ''} href={hrefFor('/fighter/mario')}><span aria-hidden="true">◎</span><strong>Guides</strong></a>
        <a className={route.page === 'practice' ? 'is-active' : ''} href={hrefFor('/practice/mario')}><span aria-hidden="true">▶</span><strong>Practice</strong></a>
        <a className={route.page === 'tools' ? 'is-active' : ''} href={hrefFor('/tools')}><span aria-hidden="true">⌁</span><strong>Tools</strong></a>
        <a className={route.page === 'about' ? 'is-active' : ''} href={hrefFor('/about')}><span aria-hidden="true">?</span><strong>About</strong></a>
      </nav>
    </div>
  )
}
