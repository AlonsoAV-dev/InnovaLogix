import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { StoreProvider } from './context/StoreContext';
import MainLayout from './layout/MainLayout';
import socketService from './services/socketService';

import POS from './pages/POS/POS';
import Inventory from './pages/Inventory/Inventory';
import Purchases from './pages/Purchases/Purchases';

// Placeholder pages
import CRM from './pages/CRM/CRM';
import Reports from './pages/Reports/Reports';

function App() {
  // Use ref to track if we've already connected (survives StrictMode double-mount)
  const hasConnected = useRef(false);

  // Initialize WebSocket connections once at app start
  useEffect(() => {
    // Only connect once, even in StrictMode development
    if (!hasConnected.current) {
      console.log('🚀 Initializing app-level WebSocket connections...');
      hasConnected.current = true;
      
      socketService.connectAll().then(() => {
        console.log('🎉 App WebSocket initialization complete');
      }).catch((error) => {
        console.error('❌ Error initializing WebSocket connections:', error);
        hasConnected.current = false; // Allow retry on error
      });
    }

    return () => {
      // Only disconnect on actual unmount, not during StrictMode cleanup
      // In production, this will properly cleanup
      // In development with StrictMode, the ref prevents reconnection
      console.log('🧹 App cleanup running (may be StrictMode)');
    };
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <StoreProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/pos" replace />} />
              <Route path="pos" element={<POS />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="crm" element={<CRM />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </StoreProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
