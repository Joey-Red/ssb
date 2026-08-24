import { AppShell } from './components/AppShell'
import { FighterView } from './components/FighterView'
import { RosterView } from './components/RosterView'
import { hrefFor, useRoute } from './router'

function AboutView(){return <section className="panel"><p className="eyebrow">Frame literacy</p><h1>Frames first.</h1><p className="hero-copy">Startup, active frames, recovery, FAF, hitstun, DI and SDI use standard Smash terminology only.</p></section>}

export default function App() {
  const route = useRoute()
  const content = route.page === 'roster' ? <RosterView /> : route.page === 'fighter' ? <FighterView slug={route.slug}/> : route.page === 'about' ? <AboutView/> : <section className="panel"><h1>Page not found</h1><a className="button-link" href={hrefFor('/')}>Return to roster</a></section>
  return <AppShell route={route}>{content}</AppShell>
}
