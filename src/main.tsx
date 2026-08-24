import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './lib/theme'
import { registerOfflineSupport } from './lib/offline'
import './styles.css'
import './accessibility.css'
import './themes.css'
import './festival-layout.css'
import './visual-overrides.css'
import './festival-component-fixes.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerOfflineSupport()
