import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerOfflineSupport } from './lib/offline'
import './styles.css'
import './accessibility.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerOfflineSupport()
