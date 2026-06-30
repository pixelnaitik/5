import { QrCode, Brain, RefreshCw, ArrowRight, Microscope } from 'lucide-react';
import { motion } from 'motion/react';

export default function Features() {
  return (
    <section className="py-24 bg-surface-container-low px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 tracking-tight">Precision Diagnostics Redefined</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">Modern tools for the digital-first laboratory, built on HIPAA-compliant infrastructure.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* QR Verification */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-surface-container-lowest p-10 rounded-4xl border border-outline-variant/30 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">QR-Based Report Verification</h3>
              <p className="text-on-surface-variant max-w-md">Eliminate report tampering. Every diagnostic output contains a secure, trackable QR anchor that instantly verifies authenticity for clinicians and patients.</p>
            </div>
            <div className="mt-12 flex justify-end">
              {/* Explicit dimensions prevent CLS; lazy loading defers below-fold network cost */}
              <img 
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width="256"
                height="256"
                className="rounded-xl w-64 shadow-sm border border-outline-variant/20" 
                alt="QR code scanning for report verification"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATSsIGTYL3F_aWTqTNbeTxT7LT76ZtEMH3uxUv3D6VpERGOCaj3oTFZRoN_V7fhQja_vSxLgzxys2FkqHmcLb-wgnqEAN1gqVL1vRYKTXp-y2r1nA-bsnm73bu4mYRSCOukyW-UvGPQ9jQh9URNjtNPLjy07fsTyARryVFK7_9V8hmG7wDhvt7JFdAYnHcVgntiQolqyNmcBxB9w_SWgwZHlKaU_JPY6Zd-V1ielpnAhITAevP3yMkEKP40_2R7EdGDV4AcwAcfp0" 
              />
            </div>
          </motion.div>

          {/* AI Diagnostics */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-primary-container p-10 rounded-4xl text-white flex flex-col justify-between overflow-hidden relative"
          >
            <div className="z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Assisted Diagnostics</h3>
              <p className="text-sm opacity-80 leading-relaxed">Automated region-of-interest detection and cell counting to reduce pathologist fatigue and improve diagnostic speed.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <Microscope size={240} strokeWidth={1} />
            </div>
          </motion.div>

          {/* Real-time Sync */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container-highest p-10 rounded-4xl border border-outline-variant/30 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary mb-6">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">Real-time Cloud Sync</h3>
            <p className="text-on-surface-variant">Instant access to specimen slides across your hospital network. No more waiting for large file transfers or physical slide transport.</p>
          </motion.div>

          {/* Collaborative Workflow */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-white p-10 rounded-4xl border border-outline-variant/30 grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="order-2 md:order-1">
              {/* Explicit dimensions prevent CLS; lazy as it is below the fold */}
              <img 
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width="600"
                height="338"
                className="rounded-xl shadow-lg w-full h-auto object-cover aspect-video" 
                alt="Laboratory collaborative workflow interface"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBni3k52l9F4NRGjDxwpyWmNo_9KmcfUhBUQiyiNrA1SIU-xynQt4MkkzF57ZfYdc9snx_12L_P7myfGtTrFD10uG4bCMS9VMZiAOrf58u7J0j3fIisKtcMdDPy0EKisMDBnb7wwYULTrqlQ503Sf_9sG8mK5acIakpuQbmUPwjK1KDr8ocyOz7FY_oqnuIM1NEdvsYjNX3sz_LeLqQNaw00fSLbGY82npZkrbmG3js77HIxPlXgbpMD5hql-w25xGoN62048rg8OA" 
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-bold text-primary mb-4">Collaborative Workflow</h3>
              <p className="text-on-surface-variant leading-relaxed">Share cases with specialists for second opinions in one click. Healthcare OS maintains a complete audit trail for every interaction.</p>
              <a className="mt-6 inline-flex items-center text-secondary font-semibold gap-1 hover:underline" href="#">
                Learn about clinical audits <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
