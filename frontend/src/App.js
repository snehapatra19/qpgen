import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import './index.css';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid #3d3d6e', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif" },
          success: { iconTheme: { primary: '#7c6ef7', secondary: '#0a0a1a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a1a' } },
        }} />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}
