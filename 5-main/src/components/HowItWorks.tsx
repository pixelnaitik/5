import { motion } from 'motion/react';

const steps = [
  {
    number: '01',
    title: 'Slide Digitization',
    description: 'Upload whole-slide images from any standard scanner directly to our secure cloud.'
  },
  {
    number: '02',
    title: 'AI Analysis',
    description: 'Our proprietary neural networks segment tissues and flag suspicious regions for review.'
  },
  {
    number: '03',
    title: 'Verified Report',
    description: 'Sign off with digital signatures and generate tamper-proof, QR-anchored reports.'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">3 Simple Steps to Modernize</h2>
          <p className="text-on-surface-variant">Designed for seamless lab integration.</p>
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-24 left-0 w-full h-[2px] bg-surface-container-low z-0" />
          
          {steps.map((step, index) => (
            <motion.div 
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="flex-1 text-center relative z-10 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-primary-container flex items-center justify-center text-primary-container font-black text-xl mx-auto mb-8 shadow-md group-hover:bg-primary-container group-hover:text-white transition-all transform group-hover:scale-110">
                {step.number}
              </div>
              <h4 className="text-xl font-bold text-primary mb-3">{step.title}</h4>
              <p className="text-sm text-on-surface-variant px-4 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
