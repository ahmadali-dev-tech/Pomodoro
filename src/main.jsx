import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/bricolage-grotesque'
import App from './App'
import AppToaster from '@/components/ui/AppToaster'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <AppToaster />
    </BrowserRouter>
  </React.StrictMode>
)
