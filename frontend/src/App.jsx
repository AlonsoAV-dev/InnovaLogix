import React, { useEffect } from 'react';
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
  // Initialize WebSocket connections once at app start
  useEffect(() => {
    console.log('🚀 Initializing app-level WebSocket connections...');
    socketService.connectAll();

    return () => {
      // Cleanup on app unmount
      socketService.disconnect();
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
