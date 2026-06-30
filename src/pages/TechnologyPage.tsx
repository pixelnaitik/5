import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { QrCode, ShieldCheck, Zap, Server, Fingerprint, Lock } from 'lucide-react';

export default function TechnologyPage() {
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
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight mb-6">Built for Trust, Speed, and Precision</h1>
            <p className="text-lg text-on-surface-variant font-medium">
              Healthcare OS utilizes cutting-edge web technologies, and serverless architecture to ensure your laboratory data is always secure, accessible, and indisputable.
            </p>
          </motion.div>

          {/* QR Verification Section */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-outline-variant/30 shadow-xl mb-24 grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-primary mb-4">QR Verification</h2>
              <p className="text-on-surface-variant mb-6">
                Every generated pathology report is stamped with a unique QR code. This ensures patients and doctors can instantly verify the authenticity of the results in real-time.
              </p>
              <ul className="space-y-4">
                {[
                  "Digital verification checks",
                  "Public verification portal without login required",
                  "Immutable record of report generation",
                  "Instant counterfeit detection"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    <span className="text-sm font-medium text-on-surface-variant">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/20 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-secondary-container opacity-20 blur-xl rounded-full" />
              <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 text-center">
                 <div className="w-48 h-48 mx-auto bg-surface-container-high rounded-xl mb-6 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-primary" />
                 </div>
                 <div className="space-y-2">
                   <div className="h-4 bg-surface-container rounded w-3/4 mx-auto" />
                   <div className="h-4 bg-surface-container rounded w-1/2 mx-auto" />
                 </div>
                 <div className="mt-8 py-3 bg-secondary/10 text-secondary rounded-lg font-bold flex items-center justify-center gap-2">
                   <ShieldCheck className="w-5 h-5" />
                   Verified Authentic
                 </div>
              </div>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">The Healthcare OS Advantage</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Server, 
                  title: 'Cloud-Native Infrastructure', 
                  desc: 'Scale effortlessly with our modern serverless architecture powered by global content delivery networks.' 
                },
                { 
                  icon: Lock, 
                  title: 'Enterprise-Grade Security', 
                  desc: 'End-to-end encryption for all patient health information (PHI) in compliance with global health data standards.' 
                },
                { 
                  icon: Zap, 
                  title: 'Real-Time Sync', 
                  desc: 'Multi-party synchronization ensures doctors, lab techs, and patients see updates the second they happen.' 
                },
                { 
                  icon: Fingerprint, 
                  title: 'Identity & Access Management', 
                  desc: 'Granular role-based access control (RBAC) ensuring staff only see what they are authorized to.' 
                },
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm"
                >
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-6 h-6 text-primary-container" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">{benefit.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}
