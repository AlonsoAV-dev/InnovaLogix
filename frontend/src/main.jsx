import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { StoreProvider } from './context/StoreContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* <div style={{ color: 'white', fontSize: '24px', padding: '20px' }}>
        React Root Loaded. Sanity Check: Hello World (No Store)
      </div> */}

      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>

    </ErrorBoundary>
  </React.StrictMode>,
)
