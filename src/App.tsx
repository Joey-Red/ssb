import { hrefFor, useRoute } from './router'

export default function App() {
  const route = useRoute()
  return (
    <main className="starter-shell">
      <p>SSBU TRAINING GUIDE</p>
      <h1>{route.page === 'fighter' ? route.slug : route.page}</h1>
      <span>GitHub Pages-safe hash routing is active.</span>
      <nav><a href={hrefFor('/')}>Roster</a> · <a href={hrefFor('/fighter/mario')}>Mario</a> · <a href={hrefFor('/about')}>About</a></nav>
    </main>
  )
}
