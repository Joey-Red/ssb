import type { ReactNode } from 'react'
import { allGuides } from '../data/allGuides'
import { fighterBySlug, roster } from '../data/roster'
import { toggleTheme, useTheme } from '../lib/theme'
import { hrefFor, type AppRoute } from '../router'

export function AppShell({ route, children }: { route: AppRoute; children: ReactNode }) {
  const theme = useTheme()
  const fighterName = route.page === 'fighter' || route.page === 'practice'
    ? fighterBySlug.get(route.slug)?.name
    : undefined

  const title = route.page === 'roster'
    ? 'Roster'
    : route.page === 'fighter'
      ? fighterName ?? 'Fighter'
      : route.page === 'practice'
        ? `${fighterName ?? 'Fighter'} Practice`
        : route.page === 'drills'
          ? 'Custom Drills'
          : route.page === 'tools'
            ? 'Frame Tools'
            : route.page === 'about'
              ? 'About'
              : 'Not found'

  const subtitle = route.page === 'roster'
    ? 'Choose your fighter · train with intent'
    : route.page === 'fighter'
      ? 'Guide · routes · frame data · visuals'
      : route.page === 'practice'
        ? 'Focused reps and progression'
        : route.page === 'drills'
          ? 'Build and track your rep queue'
          : route.page === 'tools'
            ? 'Compare moves and OOS startup'
            : 'Frame-literate training notes'

  const alternateTheme = theme === 'festival' ? 'Arena' : 'Festival'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <a className="brand" href={hrefFor('/')} aria-label="SSBU Training Guide home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span><strong>SSBU</strong><small>TRAINING FESTIVAL</small></span>
        </a>
        <p className="nav-label">Training menu</p>
        <nav className="side-nav" aria-label="Primary">
          <a className={route.page === 'roster' ? 'is-active' : ''} href={hrefFor('/')}><span aria-hidden="true">▦</span><strong>Roster</strong><em>{roster.length}</em></a>
          <a className={route.page === 'fighter' ? 'is-active' : ''} href={hrefFor('/fighter/mario')}><span aria-hidden="true">◎</span><strong>Fighter guides</strong><em>{allGuides.length}</em></a>
          <a className={route.page === 'practice' ? 'is-active' : ''} href={hrefFor('/practice/mario')}><span aria-hidden="true">▶</span><strong>Practice</strong></a>
          <a className={route.page === 'drills' ? 'is-active' : ''} href={hrefFor('/drills')}><span aria-hidden="true">✓</span><strong>Custom drills</strong></a>
          <a className={route.page === 'tools' ? 'is-active' : ''} href={hrefFor('/tools')}><span aria-hidden="true">⌁</span><strong>Frame tools</strong></a>
          <a className={route.page === 'about' ? 'is-active' : ''} href={hrefFor('/about')}><span aria-hidden="true">?</span><strong>How to read it</strong></a>
        </nav>
        <div className="sidebar-footer"><span className="health-dot" aria-hidden="true"/><strong>Static & local-first</strong><p>No server, login, telemetry, or automatic third-party asset requests.</p></div>
      </aside>
      <div className="app-column">
        <header className="topbar">
          <div><h2>{title}</h2><p>{subtitle}</p></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${alternateTheme} theme`} title={`Switch to ${alternateTheme} theme`}>
              <span className="theme-toggle__dot" aria-hidden="true" />
              <span className="theme-toggle__label">{theme === 'festival' ? 'Festival' : 'Arena'}</span>
            </button>
            <div className="topbar-status"><span className="health-dot" aria-hidden="true"/><strong>Ready</strong><span>{allGuides.length}/{roster.length} guides</span></div>
          </div>
        </header>
        <main id="main-content" className="content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile primary">
        <a className={route.page === 'roster' ? 'is-active' : ''} href={hrefFor('/')}><span aria-hidden="true">▦</span><strong>Roster</strong></a>
        <a className={route.page === 'fighter' ? 'is-active' : ''} href={hrefFor('/fighter/mario')}><span aria-hidden="true">◎</span><strong>Guides</strong></a>
        <a className={route.page === 'practice' ? 'is-active' : ''} href={hrefFor('/practice/mario')}><span aria-hidden="true">▶</span><strong>Practice</strong></a>
        <a className={route.page === 'drills' ? 'is-active' : ''} href={hrefFor('/drills')}><span aria-hidden="true">✓</span><strong>Drills</strong></a>
        <a className={route.page === 'tools' ? 'is-active' : ''} href={hrefFor('/tools')}><span aria-hidden="true">⌁</span><strong>Tools</strong></a>
        <a className={route.page === 'about' ? 'is-active' : ''} href={hrefFor('/about')}><span aria-hidden="true">?</span><strong>About</strong></a>
      </nav>
    </div>
  )
}
