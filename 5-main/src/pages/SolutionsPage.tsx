import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { Microscope, Smartphone, Activity, Sparkles, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-secondary-container selection:text-on-secondary-container">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight mb-6">A Seamless Technology Platform for Your Lab</h1>
            <p className="text-lg text-on-surface-variant font-medium">
              Healthcare OS provides modern, fast, and secure tools designed specifically for pathologists and clinical laboratories to manage digital diagnostics seamlessly from anywhere.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {/* Solution 1 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white p-10 rounded-3xl border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:border-primary-container transition-colors"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Server className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-6">
                  <Activity className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">Streamlined Lab Operations</h3>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Streamline your day-to-day operations with an easy-to-use interface. Manage patient registrations, generate instant reports, and manage operations without needing in-house IT staff.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Zero server maintenance or installation', 'Secure cloud storage for all records', 'Lightning-fast data entry', 'Staff roles and access control'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Solution 2 */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               viewport={{ once: true }}
               className="bg-primary p-10 rounded-3xl shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Smartphone className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Modern Patient Experience</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Provide a premium digital experience for clinicians and patients. Automatically deliver secure, scannable digital reports to your patients the second they are verified by your pathologist.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Instant SMS & Email report delivery', 'Verified QR codes', 'Clean, modern PDF report designs', 'Self-serve public verification portal'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* CTA embedded */}
          <div className="bg-surface-container-low rounded-3xl p-12 text-center border border-outline-variant/30">
            <h2 className="text-3xl font-bold text-primary mb-4">Ready to explore Healthcare OS?</h2>
            <p className="text-on-surface-variant mb-8 max-w-2xl mx-auto">
              Access the secure, clinical-grade pathology sandbox right now to experience modern, AI-assisted laboratory workflows.
            </p>
            <Link to="/auth">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90 shadow-md"
              >
                Enter Live Demo Portal
              </motion.button>
            </Link>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
