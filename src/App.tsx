import { AppShell } from './components/AppShell'
import { RosterView } from './components/RosterView'
import { hrefFor, useRoute } from './router'

export default function App() {
  const route = useRoute()
  const content = route.page === 'roster' ? <RosterView /> : route.page === 'about' ? (
    <section className="panel"><p className="eyebrow">Frame literacy</p><h1>Frames first.</h1><p className="hero-copy">Startup, active frames, recovery, FAF, hitstun, DI and SDI use standard Smash terminology only.</p></section>
  ) : route.page === 'fighter' ? (
    <section className="panel"><p className="eyebrow">Fighter guide</p><h1>{route.slug.replaceAll('-', ' ')}</h1><p className="hero-copy">The fighter page shell is the next milestone.</p></section>
  ) : <section className="panel"><h1>Page not found</h1><a className="button-link" href={hrefFor('/')}>Return to roster</a></section>
  return <AppShell route={route}>{content}</AppShell>
}
