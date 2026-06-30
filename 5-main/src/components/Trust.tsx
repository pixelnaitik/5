import { ShieldCheck, Lock, Activity, Scale } from 'lucide-react';
import { motion } from 'motion/react';

const certifications = [
  { icon: ShieldCheck, label: 'HIPAA Compliant' },
  { icon: Lock, label: 'SOC 2 Type II' },
  { icon: Activity, label: 'CE Mark (IVD)' },
  { icon: Scale, label: 'GDPR Compliant' }
];

export default function Trust() {
  return (
    <section className="py-20 bg-surface-container-low px-6 border-t border-outline-variant/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-md">
          <h3 className="text-3xl font-bold text-primary mb-2">Clinical Grade Trust</h3>
          <p className="text-on-surface-variant leading-relaxed">Healthcare OS is trusted by over 200+ global diagnostic centers for their mission-critical workflows.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 opacity-80">
          {certifications.map(({ icon: Icon, label }, index) => (
            <motion.div 
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-outline-variant/10 mb-3 hover:text-secondary transition-colors">
                <Icon className="w-8 h-8 text-secondary" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant text-center">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
