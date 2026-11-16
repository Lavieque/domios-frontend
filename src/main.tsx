import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/dm-sans/index.css'
import '@fontsource/libre-caslon-display/400.css'
import './index.css'
import './editorial.css'
import './editorial-pages.css'
import './editorial-mobile.css'
import App from './App.tsx'
import { useLanguage } from './i18n'
import { startAccountLanguageSync } from './i18n/accountLanguage'


/**
 * Quando a língua muda, a app remonta: os textos lidos fora dos componentes
 * (rótulos, formatadores) voltam a ser lidos na língua nova.
 */
function LanguageRoot() {
  const lang = useLanguage()
  return <App key={lang} />
}

async function boot() {
  // Build de demonstração: a Api é falsa e corre no próprio browser (src/demo).
  if (import.meta.env.VITE_DEMO === 'true') {
    const { installDemo } = await import('./demo/install')
    installDemo()
  }
  startAccountLanguageSync()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <LanguageRoot />
      </BrowserRouter>
    </StrictMode>,
  )
}

void boot()
