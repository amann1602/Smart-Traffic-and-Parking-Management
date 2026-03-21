import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TrafficPage from './pages/TrafficPage';
import SignalsPage from './pages/SignalsPage';
import ParkingPage from './pages/ParkingPage';
import ViolationsPage from './pages/ViolationsPage';
import EmergencyPage from './pages/EmergencyPage';
import MapPage from './pages/MapPage';
import AdminPanel from './pages/AdminPanel';
import SystemLogs from './pages/SystemLogs';

// Loading spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full"
          style={{
            border: '3px solid rgba(29,110,245,0.2)',
            borderTopColor: '#1d6ef5',
            animation: 'spin 0.8s linear infinite',
          }} />
        <p className="text-blue-400 text-sm font-medium">Pune Smart City</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Loading system...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

// Main authenticated application with CityProvider wrapping all routes once
function AuthenticatedApp() {
  return (
    <CityProvider>
      <Layout>
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/traffic"    element={<TrafficPage />} />
          <Route path="/signals"    element={<SignalsPage />} />
          <Route path="/parking"    element={<ParkingPage />} />
          <Route path="/violations" element={<ViolationsPage />} />
          <Route path="/emergency"  element={<EmergencyPage />} />
          <Route path="/map"        element={<MapPage />} />
          <Route path="/admin"      element={<AdminPanel />} />
          <Route path="/logs"       element={<SystemLogs />} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </CityProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/"      element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/*"     element={
        <ProtectedRoute>
          <AuthenticatedApp />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

