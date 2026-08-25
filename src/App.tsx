import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import CoinDetailPage from './pages/CoinDetailPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Router shell. Everything route-specific lives in `pages/`; this file only
 * decides what renders where, and provides the state both routes share.
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/coins/:coinId" element={<CoinDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
