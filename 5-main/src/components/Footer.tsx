import { Globe, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <span className="font-black text-primary text-xl block mb-6 tracking-tighter">Healthcare OS</span>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Leading the transition to AI-native digital pathology laboratories worldwide.</p>
            <div className="flex gap-4">
              {[Globe, Share2].map((Icon, idx) => (
                <a key={idx} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-white transition-all border border-outline-variant/10 shadow-sm" href="#">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-6">Product</h4>
            <ul className="space-y-4 text-xs text-on-surface-variant">
              {['Case Management', 'AI Screening', 'Lab Analytics', 'Cloud Storage'].map(link => (
                <li key={link}><a className="hover:text-primary transition-colors hover:underline" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-6">Compliance</h4>
            <ul className="space-y-4 text-xs text-on-surface-variant">
              {['HIPAA Compliance', 'GDPR Data Rights', 'Trust Center', 'Security Overview'].map(link => (
                <li key={link}><a className="hover:text-primary transition-colors hover:underline" href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-6">Contact</h4>
            <ul className="space-y-4 text-xs text-on-surface-variant">
              {['Contact Support', 'Clinical Advisory', 'Press Inquiries'].map(link => (
                <li key={link}><a className="hover:text-primary transition-colors hover:underline" href="#">{link}</a></li>
              ))}
              <li className="pt-4"><span className="text-secondary font-bold text-sm tracking-tight">support@pathologyos.com</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-outline-variant/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-on-surface-variant opacity-70">© 2026 Healthcare OS Diagnostic Systems. Clinical Grade Precision.</span>
          <div className="flex gap-6 text-xs text-on-surface-variant font-medium">
            <a className="hover:text-primary transition-all hover:underline" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-all hover:underline" href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
