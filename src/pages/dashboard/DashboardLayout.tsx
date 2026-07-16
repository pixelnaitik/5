import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3,
  PieChart,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Microscope,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Activity,
  User,
  HelpCircle
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import BackButton from '../../components/BackButton';
import { applyTheme } from '../../lib/theme';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  roles?: ('admin' | 'staff')[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Microscope },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
];

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab 
}: { 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const { user, role, isAdmin, logout } = useAuth();
  // Use matchMedia instead of window.innerWidth to avoid forced reflow on mount
  const mql = window.matchMedia('(max-width: 767px)');
  const [isMobile, setIsMobile] = useState(mql.matches);
  const [sidebarOpen, setSidebarOpen] = useState(!mql.matches);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState(user?.photoURL || 'default');

  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const handleUpgrade = async () => {
    if (!upgradePassword || !user) return;
    setUpgrading(true);
    setUpgradeError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'staff',
        upgradeCode: upgradePassword
      });
      setUpgradePassword('');
    } catch(err: any) {
      console.error(err);
      setUpgradeError('Invalid access code.');
    }
    setUpgrading(false);
  }

  React.useEffect(() => {
    const loadSettings = () => {
      try {
        const s = localStorage.getItem('pathologyos_settings');
        if (s) {
          const parsed = JSON.parse(s);
          if (parsed.avatarSeed) {
            setAvatarSeed(parsed.avatarSeed);
          }
          if (parsed.themeId) {
            applyTheme(parsed.themeId);
          }
        }
      } catch (e) {}
    };

    loadSettings();
    window.addEventListener('settings-updated', loadSettings);
    return () => window.removeEventListener('settings-updated', loadSettings);
  }, []);

  const renderAvatar = (seed: string) => {
    if (seed?.startsWith('http')) return <img src={seed} alt="Avatar" className="w-full h-full object-cover" />;
    const props = { className: "w-full h-full p-2" };
    switch (seed) {
      case 'microscope': return <Microscope {...props} className="w-full h-full p-2 text-blue-500" />;
      case 'droplets': return <div className="w-full h-full p-2 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg></div>;
      case 'activity': return <Activity {...props} className="w-full h-full p-2 text-green-500" />;
      case 'flask': return <div className="w-full h-full p-2 text-yellow-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a2.5 2.5 0 0 0 2.227 3.45h10.106a2.5 2.5 0 0 0 2.227-3.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M14 16H5.5"/></svg></div>;
      case 'syringe': return <div className="w-full h-full p-2 text-purple-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.4 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg></div>;
      case 'dna': return <div className="w-full h-full p-2 text-pink-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 15 10-10"/><path d="m3.2 12.8 5.6-5.6"/><path d="m7.4 17 5.6-5.6"/><path d="m11.6 21.2 5.6-5.6"/><path d="m12 2 10 10"/><path d="M2.5 22.5A14.1 14.1 0 0 0 22.5 2.5"/><path d="M12 12a14.1 14.1 0 0 0-10-10"/></svg></div>;
      case 'user':
      default: return <User className="w-full h-full p-2 text-slate-500" />;
    }
  };

  // Use matchMedia change event — no forced reflow
  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileMenuOpen(false);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const handleLogout = () => logout();

  return (
    <div className="flex h-screen bg-surface-container-low overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (sidebarOpen ? 280 : 80),
          x: isMobile ? (mobileMenuOpen ? 0 : -280) : 0 
        }}
        aria-label="Main navigation"
        className={cn(
          "bg-primary text-white flex flex-col h-full border-r border-white/10 z-50 shadow-2xl shrink-0",
          "fixed md:relative"
        )}
      >
        <div className="p-4 md:p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover absolute inset-0 z-10" 
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />
            <Microscope className="w-6 h-6 z-0" />
          </div>
          {(sidebarOpen || mobileMenuOpen) && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-black tracking-tighter"
            >
              Healthcare OS
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-6 overflow-y-auto" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                // Use matchMedia to avoid forced reflow from window.innerWidth
                if (window.matchMedia('(max-width: 767px)').matches) setMobileMenuOpen(false);
              }}
              aria-label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-white/10 text-white shadow-inner" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6 shrink-0", activeTab === item.id && "text-secondary-fixed")} aria-hidden="true" />
              {(sidebarOpen || mobileMenuOpen) && (
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="font-medium text-sm text-left flex-1"
                >
                  {item.label}
                </motion.span>
              )}
              {activeTab === item.id && (sidebarOpen || mobileMenuOpen) && (
                <ChevronRight className="w-4 h-4 ml-auto text-white/40" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <button 
            onClick={handleLogout}
            aria-label="Logout"
            className="w-full flex items-center gap-4 p-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group"
          >
            <LogOut className="w-6 h-6 shrink-0 group-hover:text-error" aria-hidden="true" />
            {(sidebarOpen || mobileMenuOpen) && <span className="font-medium text-sm text-left flex-1">Logout</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
          className="absolute -right-4 top-10 w-8 h-8 bg-white text-primary rounded-full shadow-lg items-center justify-center border border-outline-variant/30 hidden md:flex"
        >
          {sidebarOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main role="main" className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header role="banner" className="h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-primary"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="main-nav"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <BackButton 
              className="hidden md:flex !static !py-1 !px-3" 
              onClick={activeTab === 'settings' ? () => setActiveTab('dashboard') : undefined}
            />
            <h2 className="text-lg font-bold text-primary capitalize hidden sm:block">{activeTab}</h2>
          </div>
          <div 
            className="flex items-center gap-4 cursor-pointer hover:bg-surface-container-low p-1.5 -mr-1.5 rounded-2xl transition-colors"
            onClick={() => setActiveTab('settings')}
            role="button"
            tabIndex={0}
            aria-label="Open settings"
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('settings')}
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-primary">{user?.displayName || 'Dr. Pathologist'}</span>
              <span className="text-[10px] text-on-surface-variant">LIMS Control Panel</span>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center overflow-hidden">
              {renderAvatar(avatarSeed)}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {role === 'guest' && (
              <div className="mb-8 p-6 bg-error-container text-on-error-container rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-sm border border-error/20">
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-8 h-8 text-error" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-xl mb-1 text-error">Limited Access (Read Only)</h3>
                  <p className="text-sm opacity-90 max-w-xl">You are logged in as a guest. You can view records but cannot add or modify them. Enter the staff access code to unlock editing permissions.</p>
                  {upgradeError && <p className="text-xs font-bold mt-2 text-error animate-pulse">{upgradeError}</p>}
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 relative group">
                  <input 
                     type="password" 
                     value={upgradePassword} 
                     onChange={e => setUpgradePassword(e.target.value)}
                     className="px-5 py-3 rounded-xl bg-white text-on-surface border border-error/20 focus:outline-none focus:ring-2 focus:ring-error shadow-sm w-full md:w-48 transition-all"
                     placeholder="Access Code"
                     onKeyDown={(e) => e.key === 'Enter' && handleUpgrade()}
                  />
                  <button 
                     onClick={handleUpgrade} 
                     disabled={upgrading || !upgradePassword}
                     className="px-6 py-3 bg-error text-white font-bold rounded-xl shadow-md hover:bg-error/90 active:scale-95 transition-all disabled:opacity-50"
                  >
                     {upgrading ? '...' : 'Unlock'}
                  </button>
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
