import { Search, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackButton from './BackButton';

export default function Header() {
  const { user } = useAuth();
  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30">
      <nav className="flex justify-between items-center px-4 md:px-6 py-3 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2 md:gap-8 min-w-0">
          <BackButton className="!static !py-1 !px-2 md:!px-3 hidden sm:flex" />
          <Link to="/" className="shrink-0">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg md:text-xl font-black tracking-tighter text-primary-container whitespace-nowrap"
            >
              Healthcare OS
            </motion.span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/technology"
              className="text-on-surface-variant hover:text-primary-container text-sm font-medium transition-all" 
            >
              Technology
            </Link>
            <Link 
              to="/solutions"
              className="text-on-surface-variant hover:text-primary-container text-sm font-medium transition-all" 
            >
              Solutions
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button className="p-2 text-on-surface-variant hover:text-primary-container hover:bg-surface-container rounded-full transition-all hidden sm:block">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary-container hover:bg-surface-container rounded-full transition-all hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>
          <Link to={user ? "/dashboard" : "/auth"}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 md:px-5 py-2 bg-primary-container text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
            >
              {user ? "Dashboard" : "Live Demo"}
            </motion.button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
