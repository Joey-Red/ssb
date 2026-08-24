import { AppShell } from './components/AppShell'
import { hrefFor, useRoute } from './router'

export default function App() {
  const route = useRoute()
  const content = route.page === 'roster' ? (
    <section className="hero-panel"><div><p className="eyebrow">SSBU training companion</p><h1>Pick a fighter. Practice the right thing.</h1><p className="hero-copy">The responsive application shell is ready. Roster data and training surfaces land in the next milestones.</p></div><div className="hero-stats"><div><strong>89</strong><span>fighter pages planned</span></div><div><strong>60</strong><span>frames per second</span></div></div></section>
  ) : route.page === 'about' ? (
    <section className="panel"><p className="eyebrow">Frame literacy</p><h1>Frames first.</h1><p className="hero-copy">Startup, active frames, recovery, FAF, hitstun, DI and SDI will be presented using standard Smash terminology only.</p></section>
  ) : route.page === 'fighter' ? (
    <section className="panel"><p className="eyebrow">Fighter guide</p><h1>{route.slug.replaceAll('-', ' ')}</h1><p className="hero-copy">Guide shell ready; character data is added sequentially.</p></section>
  ) : (
    <section className="panel"><h1>Page not found</h1><a className="button-link" href={hrefFor('/')}>Return to roster</a></section>
  )
  return <AppShell route={route}>{content}</AppShell>
}
