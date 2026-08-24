import { AppShell } from './components/AppShell'
import { FighterView } from './components/FighterView'
import { RosterView } from './components/RosterView'
import { hrefFor, useRoute } from './router'

const frameGlossary = [
  {
    id: 'startup',
    title: 'Startup',
    text: 'Frames before the relevant hitbox first becomes active. A frame-5 move can first hit on frame 5; frames 1–4 are startup.',
  },
  {
    id: 'active',
    title: 'Active frames',
    text: 'Frames where an attack hitbox exists. Early and late portions can use different hitboxes, damage, angles, or knockback.',
  },
  {
    id: 'faf',
    title: 'Recovery / FAF',
    text: 'Recovery is commitment after the hitbox ends. FAF means First Actionable Frame: the first frame on which the attacker can perform a new action.',
  },
  {
    id: 'landing-lag',
    title: 'Landing lag',
    text: 'Committed frames after landing during an aerial’s landing-lag window. Hitting low to the ground can reduce the time before landing, but the move still has its listed landing lag.',
  },
  {
    id: 'autocancel',
    title: 'Autocancel',
    text: 'Move-specific aerial windows where landing avoids that aerial’s normal landing lag and uses normal landing behavior instead.',
  },
  {
    id: 'hitlag',
    title: 'Hitlag',
    text: 'The brief impact freeze when an attack connects. SDI is performed during hitlag. Hitlag and hitstun are different systems.',
  },
  {
    id: 'hitstun',
    title: 'Hitstun',
    text: 'Time after launch when the victim cannot act. A true combo must connect its next hit before the victim receives an actionable frame under the stated conditions.',
  },
  {
    id: 'shield-advantage',
    title: 'Shield advantage',
    text: 'How many frames earlier or later the attacker can act after a blocked move. Negative values favor the defender; spacing and reach still determine whether a punish actually connects.',
  },
  {
    id: 'oos',
    title: 'Out of shield (OOS)',
    text: 'An option used from shield. Aerial OOS timings include Ultimate’s 3-frame jumpsquat; up smash and up special can be performed directly out of shield.',
  },
  {
    id: 'di-sdi',
    title: 'DI & SDI',
    text: 'DI changes launch trajectory. SDI shifts the character during hitlag. Either can change a combo route, so the guide records conditions instead of assuming one universal path.',
  },
  {
    id: 'classification',
    title: 'Combo classification',
    text: 'True, kill confirm, DI dependent, character dependent, and practice route are separate labels. “True” is reserved for routes where the defender cannot act before the next hit under documented conditions.',
  },
] as const

function AboutView() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">How to read the guide</p>
          <h1>Frames first. Conditions always.</h1>
          <p className="hero-copy">
            SSBU runs at 60 FPS. One game frame is about 16.67 ms. “Frame 5” means the relevant hitbox can first appear on the fifth game frame after the move begins. This app uses real Smash frames only.
          </p>
        </div>
      </section>
      <section
        className="panel"
        aria-label="Frame data glossary"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 8 }}
      >
        {frameGlossary.map((item, index) => (
          <article id={item.id} key={item.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14 }}>
            <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span>
            <h2 style={{ margin: '5px 0', fontSize: 18 }}>{item.title}</h2>
            <p className="hero-copy" style={{ fontSize: 12 }}>{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  let content
  if (route.page === 'roster') content = <RosterView />
  else if (route.page === 'fighter') content = <FighterView slug={route.slug} />
  else if (route.page === 'about') content = <AboutView />
  else {
    content = (
      <section className="panel empty-state">
        <span className="empty-state__icon" aria-hidden="true">404</span>
        <h1>Page not found</h1>
        <p>This route is not part of the app.</p>
        <a className="button-link" href={hrefFor('/')}>Return to roster</a>
      </section>
    )
  }
  return <AppShell route={route}>{content}</AppShell>
}
