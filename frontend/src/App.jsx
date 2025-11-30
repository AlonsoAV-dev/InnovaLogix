import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layout/MainLayout';

import POS from './pages/POS/POS';
import Inventory from './pages/Inventory/Inventory';
import Purchases from './pages/Purchases/Purchases';

// Placeholder pages
import CRM from './pages/CRM/CRM';
import Reports from './pages/Reports/Reports';

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
