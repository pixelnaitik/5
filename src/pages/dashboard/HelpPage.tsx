import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  HelpCircle, 
  Users, 
  FileText, 
  Activity, 
  Settings, 
  ChevronDown, 
  Microscope,
  ShieldCheck,
  Download,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<'features' | 'faq'>('features');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      title: 'Overview Dashboard',
      icon: Activity,
      color: 'bg-primary-container',
      description: 'Your clinical command center presenting key metrics and quick access tables.',
      details: [
        'KPI cards showing Total Patients and Finalized Reports with weekly comparison trends.',
        'Patients Registry table: Lists recently registered patients with buttons to Register a Patient or Manage Patients.',
        'Reports Desk: Shows finalized and pending reports. Rows show a status badge (FINAL or PENDING) and signature security status (Secured or Unsigned).',
        'Quick Actions: Clicking on a patient row opens their profile, clicking on a report opens its editor, and clicking on a pending report opens report creation.'
      ]
    },
    {
      title: 'Patients Registry',
      icon: Users,
      color: 'bg-secondary',
      description: 'Centralized registry to manage patient information and test requests.',
      details: [
        'Register Patient: Add full name, age, gender, phone, referring doctor, address, and test selections.',
        'Search & Filter: Locate patient records instantly by searching their name or phone number, or filtering by registration dates.',
        'Update details at any time by clicking the Edit icon on their registry row.'
      ]
    },
    {
      title: 'Doctors Directory',
      icon: Microscope,
      color: 'bg-blue-600',
      description: 'Manage clinical contacts and referral details.',
      details: [
        'Keep track of referring physicians who request diagnostics.',
        'Add new doctor records directly while registering a patient by typing their name and selecting "Add as new doctor".'
      ]
    },
    {
      title: 'Reports & Security',
      icon: FileText,
      color: 'bg-tertiary',
      description: 'Build, sign, verify, and export diagnostic pathology reports.',
      details: [
        'Generate Reports: Create a report for a patient. Fill in test values with real-time normal/high/low visual indicator badges.',
        'Auto-Calculations: CBC values (absolute counts) and RBC indices (MCV, MCH, MCHC) auto-calculate as you type.',
        'Cryptographic Signature: Every finalized report gets a unique tamper-proof digital signature generated using HMAC-SHA256.',
        'Public Verification QR: Prints a QR code on the PDF linking to a public verification page where clinicians can verify authenticity.',
        'Export formats: Download high-quality PDFs, Print directly, or Share instantly via WhatsApp.'
      ]
    },
    {
      title: 'LIMS Settings',
      icon: Settings,
      color: 'bg-slate-600',
      description: 'Customize application theme, avatars, and PDF print formatting.',
      details: [
        'Visual Styles: Switch themes and pick custom profile avatars.',
        'PDF Layout: Adjust page margins (Modern, Minimalist, Classic, or Blank templates) and text font sizes.',
        'Cell Padding & Spacing: Fine-tune row density for compact and multi-page reports.',
        'QR Code Styling: Reposition, resize, or style the verification QR code printed on PDFs.'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do clinicians verify the authenticity of a printed report?',
      answer: 'Every finalized pathology report is secured using a cryptographically generated digital signature via HMAC-SHA256 (Hash-based Message Authentication Code). To prevent tampering, the report\'s dataset (patient ID, name, test selections, results, and timestamp) is sorted lexicographically by keys and serialized into a deterministic JSON string. This string is signed on the server side using a private key (REPORT_SECRET_KEY). Printed PDF reports display a verification QR Code encoding a unique URL: https://[domain]/verify?id=[reportId]. Scanning this QR code retrieves the original database values, re-runs the deterministic serialization, and recalculates the HMAC signature using the private key. If the computed signature matches the database record, the report is verified as authentic; otherwise, the portal flags it as altered.'
    },
    {
      question: 'How does CBC auto-calculation work?',
      answer: 'The system automates clinical calculations in real-time as values are typed. (1) Absolute Leukocyte Counts: Absolute count = (Differential Percentage / 100) * White Cell Count (TC). This applies to Absolute Neutrophils, Lymphocytes, Monocytes, Eosinophils, and Basophils. (2) RBC Indices: Standard indices are calculated from Red Blood Cell (RBC) count, Hemoglobin (HB), and Hematocrit (HCT/PCV) using these clinical formulas: (a) MCV (Mean Corpuscular Volume in fL) = (HCT % * 10) / RBC (10^6/µL). (b) MCH (Mean Corpuscular Hemoglobin in pg) = (HB g/dL * 10) / RBC (10^6/µL). (c) MCHC (Mean Corpuscular Hemoglobin Concentration in g/dL) = (HB g/dL * 100) / HCT %.'
    },
    {
      question: 'Why are newly added patients showing as "Pending" in the Reports Desk?',
      answer: 'When you register a patient with selected tests but haven\'t filled out their results yet, they wait in a queue. They show as "Pending" (Awaiting Report) so you can click their row on the Overview page to immediately open the test entry sheet, fill in values, and finalize the report.'
    },
    {
      question: 'Can I edit a report after it has been finalized?',
      answer: 'Yes, select the report in the Reports tab to open its editor, update the necessary test values, and click "Save Results". The system will automatically recalculate all indices, generate a new cryptographic signature to ensure security, and update the database.'
    },
    {
      question: 'How do I customize the letterhead template?',
      answer: 'Go to Settings. Under Report Layout, you can choose from Blank (for pre-printed stationery), Modern, Classic, or Minimalist templates. You can also specify custom top/bottom/left margins, table body font sizes, and cell padding to ensure your reports look clean and professional.'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container p-8 md:p-10 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <BookOpen size={300} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
            Healthcare OS Documentation
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3 mb-4 leading-tight">
            User Help Center & FAQ
          </h2>
          <p className="text-sm md:text-base text-white/80 leading-relaxed">
            Welcome to the guide. Learn how to manage patients, generate secure diagnostic reports, configure PDF print templates, and utilize LIMS workflow integrations.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        <button
          onClick={() => setActiveSection('features')}
          className={cn(
            "pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeSection === 'features' 
              ? "border-primary text-primary" 
              : "border-transparent text-on-surface-variant hover:text-primary"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Feature Guides
        </button>
        <button
          onClick={() => setActiveSection('faq')}
          className={cn(
            "pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeSection === 'faq' 
              ? "border-primary text-primary" 
              : "border-transparent text-on-surface-variant hover:text-primary"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Frequently Asked Questions
        </button>
      </div>

      {/* Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeSection === 'features' ? (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {features.map((feature, idx) => (
                <div 
                  key={feature.title}
                  className="bg-white p-6 md:p-8 rounded-4xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow"
                >
                  <div className={cn("p-4 rounded-3xl text-white shadow-lg shrink-0", feature.color)}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {feature.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex gap-2.5 items-start text-xs text-on-surface-variant leading-relaxed">
                          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div 
                    key={idx}
                    className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full flex justify-between items-center p-6 text-left cursor-pointer hover:bg-surface-container-low/30 transition-colors"
                    >
                      <h4 className="text-base font-bold text-primary pr-8">{faq.question}</h4>
                      <ChevronDown 
                        className={cn("w-5 h-5 text-primary shrink-0 transition-transform duration-300", isExpanded && "rotate-180")} 
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-1 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
