import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import NProgress from 'nprogress';

import { auth } from './lib/firebase';

const LandingPage = lazy(() => import('./LandingPage'));
const TechnologyPage = lazy(() => import('./pages/TechnologyPage'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const PatientsPage = lazy(() => import('./pages/dashboard/PatientsPage'));
const DoctorsPage = lazy(() => import('./pages/dashboard/DoctorsPage'));
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const HelpPage = lazy(() => import('./pages/dashboard/HelpPage'));

// Wrapper that shows NProgress bar while a lazy chunk is loading
function ProgressSuspense({ children, fullScreen = false }: { children: React.ReactNode; fullScreen?: boolean }) {
  return (
    <Suspense
      fallback={
        <LazyFallback fullScreen={fullScreen} />
      }
    >
      {children}
    </Suspense>
  );
}

function LazyFallback({ fullScreen }: { fullScreen: boolean }) {
  useEffect(() => {
    NProgress.start();
    return () => { NProgress.done(); };
  }, []);

  return (
    <div className={`${fullScreen ? 'h-screen' : 'h-[50vh]'} flex items-center justify-center bg-surface-container-low`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-container" />
    </div>
  );
}

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
  const [patientsTabAction, setPatientsTabAction] = useState<string | null>(null);
  const [reportsTabAction, setReportsTabAction] = useState<string | null>(null);
  const [createReportPatientId, setCreateReportPatientId] = useState<string | null>(null);

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ProgressSuspense>
        {activeTab === 'dashboard' && (
          <OverviewPage 
            setActiveTab={setActiveTab} 
            onAddPatient={() => {
              setPatientsTabAction('add');
              setActiveTab('patients');
            }}
            onManageReport={(reportId) => {
              setReportsTabAction(reportId);
              setActiveTab('reports');
            }}
            onCreateReportForPatient={(patientId) => {
              setCreateReportPatientId(patientId);
              setActiveTab('reports');
            }}
          />
        )}
        {activeTab === 'patients' && (
          <PatientsPage 
            initialAction={patientsTabAction} 
            clearAction={() => setPatientsTabAction(null)} 
          />
        )}
        {activeTab === 'doctors' && <DoctorsPage />}
        {activeTab === 'reports' && (
          <ReportsPage 
            initialReportId={reportsTabAction} 
            clearAction={() => setReportsTabAction(null)} 
            initialCreateReportPatientId={createReportPatientId}
            clearCreateAction={() => setCreateReportPatientId(null)}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'help' && <HelpPage />}
      </ProgressSuspense>
    </DashboardLayout>
  );
}

interface AppProps {
  onReady?: () => void;
}

export default function App({ onReady }: AppProps) {
  useEffect(() => {
    // Signal that React has fully mounted — remove the HTML splash screen
    NProgress.done();
    onReady?.();
  }, [onReady]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ProgressSuspense fullScreen>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        </ProgressSuspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
