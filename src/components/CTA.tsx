import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto bg-primary text-white rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary opacity-50" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tight">Experience Healthcare OS Live</h2>
          <p className="text-xl md:text-2xl opacity-80 mb-12 max-w-2xl mx-auto font-medium">Explore the secure, clinical-grade pathology dashboard and patient report portal right now.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-primary font-bold rounded-2xl hover:bg-surface transition-all shadow-xl"
              >
                Enter Live Demo Portal
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
