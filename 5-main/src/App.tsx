import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './LandingPage';
import TechnologyPage from './pages/TechnologyPage';
import SolutionsPage from './pages/SolutionsPage';
import AuthPage from './pages/auth/AuthPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import PatientsPage from './pages/dashboard/PatientsPage';
import DoctorsPage from './pages/dashboard/DoctorsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import VerificationPage from './pages/VerificationPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import { Loader2 } from 'lucide-react';

import { auth } from './lib/firebase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, role, logout } = useAuth();
  
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-surface-container-low">
      <Loader2 className="w-10 h-10 animate-spin text-primary-container" />
    </div>
  );
  
  if (!user) return <Navigate to="/auth" />;

  if (role === 'unverified') {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-container-low p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-outline-variant/30 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-primary mb-4">Verification Required</h2>
          <p className="text-on-surface-variant mb-6">Please check your email and verify your account to access the dashboard. After verifying, you may need to reload the page or sign in again.</p>
          <button 
             onClick={logout}
             className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90"
          >
             Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!role) return (
    <div className="h-screen flex items-center justify-center bg-surface-container-low">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-container mx-auto mb-4" />
        <p className="text-on-surface-variant text-sm font-medium">Authorizing access...</p>
      </div>
    </div>
  );
  
  return <>{children}</>;
}

function DashboardShell() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <OverviewPage setActiveTab={setActiveTab} />}
      {activeTab === 'patients' && <PatientsPage />}
      {activeTab === 'doctors' && <DoctorsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'analytics' && <AnalyticsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
