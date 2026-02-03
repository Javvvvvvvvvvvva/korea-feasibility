import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// KOREA ONLY - Runtime validation
const COUNTRY = import.meta.env.VITE_COUNTRY
if (COUNTRY !== 'KOREA') {
  throw new Error('This application is configured for KOREA ONLY.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
