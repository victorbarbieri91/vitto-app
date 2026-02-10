import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// Inicializar Sentry apenas em produção (quando DSN está configurado)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Ativo apenas em produção
    enabled: import.meta.env.PROD,

    // Identificar o ambiente
    environment: import.meta.env.MODE,

    // Capturar 10% das transações para performance monitoring
    tracesSampleRate: 0.1,

    // Capturar 100% dos replays de sessões com erro, 0% das normais
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Filtrar erros de extensões do browser e scripts externos
    beforeSend(event) {
      // Ignorar erros de extensões Chrome
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('chrome-extension://')
      )) {
        return null
      }
      return event
    },
  })
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('Elemento root não encontrado no DOM')
}
