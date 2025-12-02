import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import socketService from './services/socketService';

import POS from './pages/POS/POS';
import Inventory from './pages/Inventory/Inventory';
import Purchases from './pages/Purchases/Purchases';

// Placeholder pages
import CRM from './pages/CRM/CRM';
import Reports from './pages/Reports/Reports';

// Componente protegido
function ProtectedRoutes() {
  const { isAuthenticated, user } = useAuth();
  const hasRegistered = useRef(false);

  // Registrar usuario en socket CRM cuando se autentica
  useEffect(() => {
    if (!isAuthenticated || !user) {
      hasRegistered.current = false;
      return;
    }

    const registerUser = () => {
      const crmSocket = socketService.sockets.crm;
      if (crmSocket?.connected && !hasRegistered.current) {
        crmSocket.emit('register_user', {
          userName: user.name,
          userRole: user.role
        });
        console.log('👤 Usuario registrado en CRM:', user.name, user.role);
        hasRegistered.current = true;
      }
    };

    // Intentar registrar inmediatamente
    registerUser();

    // Si no está conectado, escuchar evento connect
    const crmSocket = socketService.sockets.crm;
    if (crmSocket && !crmSocket.connected) {
      crmSocket.on('connect', registerUser);
      return () => {
        crmSocket.off('connect', registerUser);
      };
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
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
  );
}

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
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <StoreProvider>
            <ProtectedRoutes />
          </StoreProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
