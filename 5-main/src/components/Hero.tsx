import { PlayCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Hero() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden py-16 md:py-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container text-[12px] font-semibold tracking-wider mb-6">
            NEW: AI-ASSISTED SCREENING V2.0
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary leading-tight mb-6">
            Secure. Smart.<br />Digital Pathology.
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
            AI-powered lab management with verified reports. Streamline your diagnostic workflow with clinical-grade precision and real-time collaboration.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={user ? "/dashboard" : "/auth"}>
              <button className="px-8 py-4 bg-primary-container text-white font-semibold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                {user ? "Go to Dashboard" : "Enter Live Demo"}
              </button>
            </Link>
          </div>
        </motion.div>
        
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-secondary-container/20 blur-3xl rounded-full"
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="glass-card p-4 rounded-4xl border border-white/50 shadow-2xl relative z-10"
          >
            <img 
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-3xl shadow-sm" 
              alt="Laboratory dashboard"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuALQD51NaAG1Uu_g6vNZwb-gkIOFoZsqJfODfh0FZVD4jz36G02U1VDSn81GjAhXgM--BBNN7ky1YWP2zhwWgRBlk-fLOoW7W0SI5uCySHUSAHLih0bl2aYgN2KtJN6IUrOoqJK-Ju3bFlh-sFHDzi6U7gnNH4slCAec2JgvbTris17sfXOxfiUMV-SDwbwxzHu70w_gEFU23mzlaAE0iJjzEQ8GUAa9OzZo5ARibCu0QO_-UmR5285wo9Zmf3Yrx5wdgv8SmtcBlw" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-6 -left-6 glass-card p-5 rounded-2xl shadow-xl border border-white/40 max-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-secondary fill-secondary/10" />
                <span className="text-xs font-bold text-primary">Verified Scan</span>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-tight">Identity of specimen secured via QR.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
