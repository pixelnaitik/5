import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Building2, Bell, Shield, KeyRound, Save, Check, FileSignature, Activity, Plus, Trash2, Microscope, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateDefaultTemplateImage } from '../../lib/default-template';
import { THEME_OPTIONS, applyTheme } from '../../lib/theme';

export default function SettingsPage() {
  const { user, role } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'print' | 'share'>('print');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    labName: 'Healthcare OS Lab',
    address: '',
    emailNotifications: true,
    smsNotifications: false,
    twoFactor: false,
    reportTemplate: 'blank',
    shareTemplate: 'blank',
    themeId: 'navy',
    reportMarginTop: 50,
    reportMarginBottom: 20,
    reportMarginLeft: 8,
    reportMarginRight: 15,
    shareMarginTop: 40,
    shareMarginBottom: 20,
    shareMarginLeft: 15,
    shareMarginRight: 15,
    reportTableBodyFontSize: 10,
    shareTableBodyFontSize: 10,
    reportTitleFontSize: 22,
    patientInfoFontSize: 10,
    patientLineHeight: 5.5,
    reportSectionGap: 6,
    tableTitleFontSize: 11,
    tableHeaderFontSize: 9,
    tableBodyFontSize: 10,
    tableCellPadding: 1.4,
    notesFontSize: 9,
    footerFontSize: 10,
    reportQrCodeSize: 15,
    qrLabelFontSize: 7,
    reportQrColor: '#d65c46',
    reportQrY: 1,
    reportQrX: 180,
    showQrLabel: true,
    qrLabelSpacing: 3.5,
    avatarSeed: user?.photoURL || 'default',
    sharingTemplateImage: ''
  });

  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const avatarOptions = [
    'microscope',
    'droplets',
    'activity',
    'flask',
    'syringe',
    'dna',
    user?.photoURL?.startsWith('http') ? user.photoURL : 'user'
  ];

  const renderAvatar = (seed: string) => {
    if (seed?.startsWith('http')) return <img src={seed} alt="Avatar" className="w-full h-full object-cover" />;
    const props = { className: "w-full h-full p-2.5" };
    switch (seed) {
      case 'microscope': return <Microscope {...props} className="w-full h-full p-2.5 text-blue-500" />;
      case 'droplets': return <div className="w-full h-full p-2.5 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg></div>;
      case 'activity': return <Activity {...props} className="w-full h-full p-2.5 text-green-500" />;
      case 'flask': return <div className="w-full h-full p-2.5 text-yellow-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a2.5 2.5 0 0 0 2.227 3.45h10.106a2.5 2.5 0 0 0 2.227-3.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M14 16H5.5"/></svg></div>;
      case 'syringe': return <div className="w-full h-full p-2.5 text-purple-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.4 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg></div>;
      case 'dna': return <div className="w-full h-full p-2.5 text-pink-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 15 10-10"/><path d="m3.2 12.8 5.6-5.6"/><path d="m7.4 17 5.6-5.6"/><path d="m11.6 21.2 5.6-5.6"/><path d="m12 2 10 10"/><path d="M2.5 22.5A14.1 14.1 0 0 0 22.5 2.5"/><path d="M12 12a14.1 14.1 0 0 0-10-10"/></svg></div>;
      case 'user':
      default: return <User {...props} className="w-full h-full p-2.5 text-slate-500" />;
    }
  };

  const [customTests, setCustomTests] = useState<any[]>([]);

  const [newTestDraft, setNewTestDraft] = useState({
    isGroup: false,
    name: '',
    category: '',
    unit: '',
    rangeLower: '',
    rangeUpper: '',
    includedTestsStr: ''
  });
  
  useEffect(() => {
    const s = localStorage.getItem('pathologyos_settings');
    if (s) {
        try {
           const parsed = JSON.parse(s);
           // Auto-migrate old default margins (20/10/40/15) to new standard values (50/20/8/15)
           if (parsed.reportMarginTop === 20 || parsed.reportMarginTop === 40) parsed.reportMarginTop = 50;
           if (parsed.reportMarginBottom === 10) parsed.reportMarginBottom = 20;
           if (parsed.reportMarginLeft === 15) parsed.reportMarginLeft = 8;
           
           const bodyFont = parsed.tableBodyFontSize ?? 10;
           
           setFormData(prev => ({ 
              ...prev, 
              ...parsed,
              reportMarginLeft: parsed.reportMarginLeft ?? 8,
              reportMarginRight: parsed.reportMarginRight ?? 15,
              shareMarginLeft: parsed.shareMarginLeft ?? 15,
              shareMarginRight: parsed.shareMarginRight ?? 15,
              reportTableBodyFontSize: parsed.reportTableBodyFontSize ?? bodyFont,
              shareTableBodyFontSize: parsed.shareTableBodyFontSize ?? bodyFont,
              tableBodyFontSize: bodyFont,
              reportQrColor: parsed.reportQrColor ?? '#d65c46',
              reportQrY: parsed.reportQrY ?? 1,
              reportQrX: parsed.reportQrX ?? 180,
              showQrLabel: parsed.showQrLabel ?? true,
              reportQrCodeSize: parsed.reportQrCodeSize ?? 15,
              qrLabelSpacing: parsed.qrLabelSpacing ?? 3.5
           }));
           if (parsed && parsed.themeId) {
              applyTheme(parsed.themeId);
           }
        } catch (e) {}
    }
    const ct = localStorage.getItem('custom_pathology_tests');
    if (ct) {
       try {
          setCustomTests(JSON.parse(ct));
       } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (formData.themeId) {
      applyTheme(formData.themeId);
    }
  }, [formData.themeId]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('pathologyos_settings', JSON.stringify(formData));
      localStorage.setItem('custom_pathology_tests', JSON.stringify(customTests));
      applyTheme(formData.themeId || 'navy');
      window.dispatchEvent(new Event('settings-updated'));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'theme', label: 'Theme Settings', icon: Palette },
            { id: 'organization', label: 'Lab Organization', icon: Building2 },
            { id: 'templates', label: 'Report Templates', icon: FileSignature },
            { id: 'tests', label: 'Custom Tests', icon: Activity },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-container text-white shadow-md' 
                  : 'bg-white hover:bg-surface-container-low text-on-surface-variant hover:text-primary border border-outline-variant/30'
              }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-outline-variant/30 shadow-sm"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">My Profile</h3>
                  <p className="text-sm text-on-surface-variant">Update your personal information and contact details.</p>
                </div>
                
                <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/20">
                  <div className="w-20 h-20 rounded-full bg-surface-container border border-outline-variant/30 overflow-hidden shadow-inner flex items-center justify-center">
                    {renderAvatar(formData.avatarSeed)}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                      className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-primary font-bold text-sm rounded-xl border border-outline-variant/30 transition-all">
                      Change Avatar
                    </button>
                    {showAvatarOptions && (
                      <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-outline-variant/30 rounded-2xl shadow-xl z-50 p-4 grid grid-cols-3 gap-2">
                        {avatarOptions.map(seed => (
                          <button
                            key={seed}
                            onClick={() => {
                              setFormData({...formData, avatarSeed: seed});
                              setShowAvatarOptions(false);
                            }}
                            className={`w-14 h-14 flex items-center justify-center rounded-full overflow-hidden border-2 transition-all ${formData.avatarSeed === seed ? 'border-primary bg-primary/5' : 'border-transparent hover:border-outline-variant bg-surface-container'}`}
                          >
                            {renderAvatar(seed)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      value={formData.email}
                      className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface-variant cursor-not-allowed outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Role</label>
                    <div className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface-variant capitalize">
                      {role || 'Staff'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">Theme Settings</h3>
                  <p className="text-sm text-on-surface-variant text-bold">Select a professional, high-contrast theme color to personalize your workspace interface.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = (formData.themeId || 'navy') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, themeId: theme.id })}
                        className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all duration-250 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md scale-[1.01]'
                            : 'border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/45'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full border border-black/10 shadow-sm flex items-center justify-center transition-transform"
                            style={{ backgroundColor: theme.primary }}
                          >
                            {isSelected && (
                              <Check className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <span className={`font-bold block text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                              {theme.name}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">
                              {(theme.id === 'navy' && 'Corporate & Clinical Navy') ||
                               (theme.id === 'teal' && 'Vibrant Medical Teal') ||
                               (theme.id === 'amethyst' && 'Royal Laboratory Violet') ||
                               (theme.id === 'slate' && 'Elegant Slate Charcoal') ||
                               (theme.id === 'maroon' && 'Accented Hematology Red')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 shrink-0 bg-surface-container/50 p-2 rounded-xl border border-outline-variant/10">
                          <span className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: theme.primary }} />
                          <span className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: theme.primaryContainer }} />
                          <span className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: theme.secondary }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">Lab Organization</h3>
                  <p className="text-sm text-on-surface-variant">Manage your laboratory details and facility information.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Laboratory Name</label>
                    <input 
                      type="text"
                      value={formData.labName}
                      onChange={e => setFormData({...formData, labName: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Physical Address</label>
                    <textarea 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Enter full lab address..."
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none resize-none min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">Notifications</h3>
                  <p className="text-sm text-on-surface-variant">Control how you receive updates and alerts.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-primary">Email Notifications</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Receive daily summaries and critical alerts via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.emailNotifications}
                        onChange={() => setFormData({...formData, emailNotifications: !formData.emailNotifications})}
                      />
                      <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-primary">SMS Alerts</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Get instant text messages for urgent verification failures.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.smsNotifications}
                        onChange={() => setFormData({...formData, smsNotifications: !formData.smsNotifications})}
                      />
                      <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">Report Templates</h3>
                    <p className="text-sm text-on-surface-variant">Choose the visual style for your PDF reports.</p>
                  </div>
                  <div className="flex bg-surface-container-low p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTemplateTab('print')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTemplateTab === 'print' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                    >
                      Print Template
                    </button>
                    <button
                      onClick={() => setActiveTemplateTab('share')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTemplateTab === 'share' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                    >
                      Share Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Modern Template */}
                  <div 
                    onClick={() => setFormData({...formData, [activeTemplateTab === 'print' ? 'reportTemplate' : 'shareTemplate']: 'modern'})}
                    className={`cursor-pointer rounded-2xl border-2 transition-all p-4 ${(activeTemplateTab === 'print' ? formData.reportTemplate : formData.shareTemplate) === 'modern' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50 bg-white'}`}
                  >
                    <div className="aspect-[3/4] bg-white rounded-xl border border-outline-variant/20 p-3 flex flex-col shadow-sm relative overflow-hidden pointer-events-none mb-4 select-none">
                       {/* Header */}
                       <div className="text-center mb-3">
                          <h5 className="text-[12px] font-bold text-[#0b3c5d] font-sans tracking-tight">Healthcare OS Report</h5>
                       </div>
                       
                       {/* Patient Info */}
                       <div className="bg-[#f8fafc] rounded p-2 mb-3 border border-[#e2e8f0] flex justify-between font-sans">
                          <div className="space-y-0.5">
                             <p className="text-[5px] font-bold text-black">Patient Name <span className="font-normal text-black">: John Doe</span></p>
                             <p className="text-[5px] font-bold text-black">Ref By <span className="font-normal text-black">: Dr. Smith</span></p>
                          </div>
                          <div className="space-y-0.5 flex gap-2">
                             <p className="text-[5px] font-bold text-black">Age <span className="font-normal text-black">: 35</span></p>
                             <p className="text-[5px] font-bold text-black">Sex <span className="font-normal text-black">: M</span></p>
                          </div>
                       </div>
                       
                       {/* Test Values Header */}
                       <div className="bg-[#dcdcdc] py-1 mb-2 font-sans">
                          <p className="text-[6px] font-bold text-center text-black">COMPLETE BLOOD COUNT</p>
                       </div>
                       
                       {/* Table */}
                       <div className="flex text-[5px] font-bold border-b border-gray-200 pb-0.5 mb-1 px-1 text-black font-sans">
                          <div className="flex-1">Test Description</div>
                          <div className="w-12">Observed Value</div>
                          <div className="w-12">Reference Range</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-sans">
                          <div className="flex-1 text-black">Hemoglobin</div>
                          <div className="w-12 text-black font-bold">14.2 g/dL</div>
                          <div className="w-12 text-black">13.0 - 17.0</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-sans">
                          <div className="flex-1 text-black">WBC Count</div>
                          <div className="w-12 font-bold text-[#0b3c5d]">* 12,500 /cumm</div>
                          <div className="w-12 text-black">4k - 11k</div>
                       </div>
                    </div>
                    <h4 className="font-bold text-primary text-center">Modern</h4>
                    <p className="text-xs text-on-surface-variant text-center mt-1">Clean, highlighted header styles with soft backgrounds.</p>
                  </div>

                  {/* Classic Template */}
                  <div 
                    onClick={() => setFormData({...formData, [activeTemplateTab === 'print' ? 'reportTemplate' : 'shareTemplate']: 'classic'})}
                    className={`cursor-pointer rounded-2xl border-2 transition-all p-4 ${(activeTemplateTab === 'print' ? formData.reportTemplate : formData.shareTemplate) === 'classic' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50 bg-white'}`}
                  >
                    <div className="aspect-[3/4] bg-white rounded-xl border border-outline-variant/20 p-3 flex flex-col shadow-sm relative overflow-hidden pointer-events-none mb-4 select-none">
                       {/* Header */}
                       <div className="text-center mb-2 border-b-[0.5px] border-black pb-1">
                          <h5 className="text-[13px] font-bold text-black font-serif uppercase tracking-widest">Pathology Report</h5>
                       </div>
                       
                       {/* Patient Info */}
                       <div className="bg-white p-2 mb-3 border-[0.5px] border-black flex justify-between font-serif">
                          <div className="space-y-0.5">
                             <p className="text-[5px] font-bold text-black">Patient Name <span className="font-normal text-black">: John Doe</span></p>
                             <p className="text-[5px] font-bold text-black">Ref By <span className="font-normal text-black">: Dr. Smith</span></p>
                          </div>
                          <div className="space-y-0.5 flex gap-2">
                             <p className="text-[5px] font-bold text-black">Age <span className="font-normal text-black">: 35</span></p>
                             <p className="text-[5px] font-bold text-black">Sex <span className="font-normal text-black">: M</span></p>
                          </div>
                       </div>
                       
                       {/* Test Values Header */}
                       <div className="pb-1 mb-2 font-serif border-b-[0.5px] border-black">
                          <p className="text-[6.5px] font-bold text-center text-black uppercase">Complete Blood Count</p>
                       </div>
                       
                       {/* Table */}
                       <div className="flex text-[5px] font-bold mb-1 px-1 text-black font-serif">
                          <div className="flex-1">Test Description</div>
                          <div className="w-12">Observed Value</div>
                          <div className="w-12">Reference Range</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-serif">
                          <div className="flex-1 text-black">Hemoglobin</div>
                          <div className="w-12 text-black">14.2 g/dL</div>
                          <div className="w-12 text-black">13.0 - 17.0</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-serif">
                          <div className="flex-1 text-black">WBC Count</div>
                          <div className="w-12 text-black font-bold">* 12,500 /cumm</div>
                          <div className="w-12 text-black">4k - 11k</div>
                       </div>
                    </div>
                    <h4 className="font-bold text-primary text-center">Classic</h4>
                    <p className="text-xs text-on-surface-variant text-center mt-1">Traditional lab format with serif fonts and borders.</p>
                  </div>

                  {/* Minimalist Template */}
                  <div 
                    onClick={() => setFormData({...formData, [activeTemplateTab === 'print' ? 'reportTemplate' : 'shareTemplate']: 'minimalist'})}
                    className={`cursor-pointer rounded-2xl border-2 transition-all p-4 ${(activeTemplateTab === 'print' ? formData.reportTemplate : formData.shareTemplate) === 'minimalist' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50 bg-white'}`}
                  >
                    <div className="aspect-[3/4] bg-white rounded-xl border border-outline-variant/20 p-3 flex flex-col shadow-sm relative overflow-hidden pointer-events-none mb-4 select-none">
                       {/* Header */}
                       <div className="mb-2 border-b-[0.5px] border-black pb-1">
                          <h5 className="text-[10px] font-normal text-black font-sans uppercase">Laboratory Report</h5>
                       </div>
                       
                       {/* Patient Info */}
                       <div className="mb-3 flex justify-between font-sans px-1">
                          <div className="space-y-0.5">
                             <p className="text-[5px] font-bold text-black">Patient Name <span className="font-normal text-black">: John Doe</span></p>
                             <p className="text-[5px] font-bold text-black">Ref By <span className="font-normal text-black">: Dr. Smith</span></p>
                          </div>
                          <div className="space-y-0.5 flex gap-2">
                             <p className="text-[5px] font-bold text-black">Age <span className="font-normal text-black">: 35</span></p>
                             <p className="text-[5px] font-bold text-black">Sex <span className="font-normal text-black">: M</span></p>
                          </div>
                       </div>
                       
                       {/* Test Values Header */}
                       <div className="pb-1 mb-2 font-sans border-b-[0.2px] border-black">
                          <p className="text-[5.5px] font-bold text-black uppercase px-1">Complete Blood Count</p>
                       </div>
                       
                       {/* Table */}
                       <div className="flex text-[5px] font-bold mb-1 px-1 text-black font-sans">
                          <div className="flex-1">Test Description</div>
                          <div className="w-12">Observed Value</div>
                          <div className="w-12">Reference Range</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-sans">
                          <div className="flex-1 text-black">Hemoglobin</div>
                          <div className="w-12 text-black">14.2 g/dL</div>
                          <div className="w-12 text-black">13.0 - 17.0</div>
                       </div>
                       
                       <div className="flex text-[5px] px-1 mb-1 font-sans">
                          <div className="flex-1 text-black">WBC Count</div>
                          <div className="w-12 text-black font-bold">* 12,500 /cumm</div>
                          <div className="w-12 text-black">4k - 11k</div>
                       </div>
                    </div>
                    <h4 className="font-bold text-primary text-center">Minimalist</h4>
                    <p className="text-xs text-on-surface-variant text-center mt-1">Sleek, borderless design focusing purely on data.</p>
                  </div>
                  
                  {/* Without Template */}
                  <div 
                    onClick={() => setFormData({...formData, [activeTemplateTab === 'print' ? 'reportTemplate' : 'shareTemplate']: 'blank'})}
                    className={`cursor-pointer rounded-2xl border-2 transition-all p-4 ${(activeTemplateTab === 'print' ? formData.reportTemplate : formData.shareTemplate) === 'blank' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50 bg-white'}`}
                  >
                    <div className="aspect-[3/4] bg-white rounded-xl border border-outline-variant/20 p-3 flex flex-col shadow-sm relative overflow-hidden pointer-events-none mb-4 select-none">
                       {/* Patient Info Only */}
                       <div className="mt-8 border-b border-dashed border-[#e2e8f0] pb-2 flex justify-between font-sans">
                         <div className="space-y-0.5">
                           <div className="h-1.5 w-16 bg-[#0b3c5d]/20 rounded"></div>
                           <div className="h-1.5 w-12 bg-black/10 rounded"></div>
                         </div>
                         <div className="space-y-0.5 items-end flex flex-col">
                           <div className="h-1.5 w-14 bg-black/10 rounded"></div>
                           <div className="h-1.5 w-10 bg-black/10 rounded"></div>
                         </div>
                       </div>
                       
                       {/* Content */}
                       <div className="flex-1 mt-4">
                          <div className="h-1.5 w-24 bg-black/20 rounded mx-auto mb-4"></div>
                          <div className="space-y-2 mt-4">
                            <div className="h-1 w-full bg-[#f1f5f9] rounded flex justify-between">
                               <div className="h-1 w-1/3 bg-black/10 rounded"></div>
                               <div className="h-1 w-1/4 bg-black/10 rounded"></div>
                            </div>
                            <div className="h-1 w-full bg-[#f1f5f9] rounded flex justify-between">
                               <div className="h-1 w-1/4 bg-black/10 rounded"></div>
                               <div className="h-1 w-1/3 bg-black/10 rounded"></div>
                            </div>
                          </div>
                       </div>
                    </div>
                    <div className="font-bold text-sm text-center text-primary">Plain / Pre-printed Pad</div>
                    <p className="text-xs text-on-surface-variant text-center mt-1">Prints patient info and test results only, without lab header.</p>
                  </div>
                </div>

                {activeTemplateTab === 'share' && (
                  <div className="mt-8 border-t border-outline-variant/30 pt-6">
                    <h4 className="font-bold text-primary mb-4">Sharing Template Background</h4>
                    <p className="text-sm text-on-surface-variant mb-4">Upload a custom template background (A4 proportion) that will be used specifically when sharing reports.</p>
                    
                    <div className="flex flex-col gap-4">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setFormData({ ...formData, sharingTemplateImage: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-white hover:file:bg-primary transition-colors cursor-pointer"
                      />
                      {formData.sharingTemplateImage ? (
                        <div className="relative w-48 border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                          <img src={formData.sharingTemplateImage} alt="Template Preview" className="w-full h-auto object-cover" />
                          <button 
                            onClick={() => setFormData({ ...formData, sharingTemplateImage: '' })}
                            className="absolute top-2 right-2 bg-error text-white p-1 rounded-full shadow hover:bg-error/90"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Premium Built-in Template Active (Auto-Fallback)
                          </span>
                          <div className="relative w-48 border border-outline-variant/30 rounded-2xl overflow-hidden shadow-md bg-surface-container">
                            <img 
                              src="/default-share-template.png" 
                              alt="Default Template Preview" 
                              className="w-full h-auto object-cover" 
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-[#0b3c5d] text-white text-[10px] text-center py-1.5 font-bold tracking-wide">
                              Global Default Template
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Sharing Top Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.shareMarginTop}
                          onChange={e => setFormData({...formData, shareMarginTop: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Sharing Bottom Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.shareMarginBottom}
                          onChange={e => setFormData({...formData, shareMarginBottom: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Sharing Left Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.shareMarginLeft ?? 15}
                          onChange={e => setFormData({...formData, shareMarginLeft: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Sharing Right Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.shareMarginRight ?? 15}
                          onChange={e => setFormData({...formData, shareMarginRight: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Sharing Font Size (pt)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.shareTableBodyFontSize ?? 10}
                          onChange={e => setFormData({...formData, shareTableBodyFontSize: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTemplateTab === 'print' && (
                  <div className="mt-8 border-t border-outline-variant/30 pt-6">
                    <h4 className="font-bold text-primary mb-4">Report Margins (mm)</h4>
                    <p className="text-sm text-on-surface-variant mb-4">Adjust these margins to suit your pre-printed report pad's header and footer.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Top Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.reportMarginTop}
                          onChange={e => setFormData({...formData, reportMarginTop: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Bottom Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.reportMarginBottom}
                          onChange={e => setFormData({...formData, reportMarginBottom: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Left Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.reportMarginLeft ?? 8}
                          onChange={e => setFormData({...formData, reportMarginLeft: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Right Margin (mm)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.reportMarginRight ?? 15}
                          onChange={e => setFormData({...formData, reportMarginRight: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-primary uppercase ml-1">Report Font Size (pt)</label>
                        <input 
                          type="number"
                          step="any"
                          value={formData.reportTableBodyFontSize ?? 10}
                          onChange={e => setFormData({...formData, reportTableBodyFontSize: parseFloat(e.target.value) || 0, tableBodyFontSize: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                        />
                      </div>
                    </div>
                </div>
                )}

                <div className="mt-8 border-t border-outline-variant/30 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-primary">PDF Layout Controls</h4>
                      <p className="text-sm text-on-surface-variant">Tune the typography and spacing of generated reports.</p>
                    </div>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        reportTitleFontSize: 22,
                        patientInfoFontSize: 10,
                        patientLineHeight: 5.5,
                        reportSectionGap: 6,
                        tableTitleFontSize: 11,
                        tableHeaderFontSize: 9,
                        tableBodyFontSize: 10,
                        tableCellPadding: 1.4,
                        notesFontSize: 9,
                        footerFontSize: 10,
                        reportQrCodeSize: 15,
                        qrLabelFontSize: 7,
                        reportTableBodyFontSize: 10,
                        shareTableBodyFontSize: 10,
                        reportMarginTop: 50,
                        reportMarginBottom: 20,
                        reportMarginLeft: 8,
                        reportMarginRight: 15,
                        reportQrColor: '#d65c46',
                        reportQrY: 1,
                        reportQrX: 180,
                        showQrLabel: true,
                        qrLabelSpacing: 3.5
                      })}
                      className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-sm font-bold text-primary rounded-xl transition-colors"
                    >
                      Reset Defaults
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Report Title Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.reportTitleFontSize}
                        onChange={e => setFormData({...formData, reportTitleFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Main lab title size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Patient Info Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.patientInfoFontSize}
                        onChange={e => setFormData({...formData, patientInfoFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Patient/doctor/date text size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Patient Line Height</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.patientLineHeight}
                        onChange={e => setFormData({...formData, patientLineHeight: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Vertical spacing in patient details.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Section Gap</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.reportSectionGap}
                        onChange={e => setFormData({...formData, reportSectionGap: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Space between report blocks.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Table Title Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.tableTitleFontSize}
                        onChange={e => setFormData({...formData, tableTitleFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Selected test/profile title size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Table Header Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.tableHeaderFontSize}
                        onChange={e => setFormData({...formData, tableHeaderFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Column header size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Table Body Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.tableBodyFontSize}
                        onChange={e => setFormData({...formData, tableBodyFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Result row text size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Table Cell Padding</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.tableCellPadding}
                        onChange={e => setFormData({...formData, tableCellPadding: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Whitespace inside result cells.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Notes Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.notesFontSize}
                        onChange={e => setFormData({...formData, notesFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Clinical notes and significance size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">Footer Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.footerFontSize}
                        onChange={e => setFormData({...formData, footerFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">End of report footer size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Code Size</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.reportQrCodeSize}
                        onChange={e => setFormData({...formData, reportQrCodeSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Verification QR code size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Label Font</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.qrLabelFontSize}
                        onChange={e => setFormData({...formData, qrLabelFontSize: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">"Scan here to verify" text size.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Code Color</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color"
                          value={formData.reportQrColor || '#d65c46'}
                          onChange={e => setFormData({...formData, reportQrColor: e.target.value})}
                          className="w-12 h-12 p-1 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={formData.reportQrColor || '#d65c46'}
                          onChange={e => setFormData({...formData, reportQrColor: e.target.value})}
                          placeholder="#d65c46"
                          className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant ml-1">Verification QR code hex color.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Position Y (Top mm)</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.reportQrY ?? 12}
                        onChange={e => setFormData({...formData, reportQrY: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Vertical placement in mm (default 12).</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Position X (Left mm)</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.reportQrX ?? 180}
                        onChange={e => setFormData({...formData, reportQrX: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Horizontal placement in mm (default 180).</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-primary uppercase ml-1">QR Label Spacing (mm)</label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.qrLabelSpacing ?? 3.5}
                        onChange={e => setFormData({...formData, qrLabelSpacing: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none"
                      />
                      <p className="text-[10px] text-on-surface-variant ml-1">Gap between QR code and text in mm (default 3.5).</p>
                    </div>

                    <div className="space-y-1 flex flex-col justify-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none mt-4 ml-1">
                        <input 
                          type="checkbox"
                          checked={formData.showQrLabel || false}
                          onChange={e => setFormData({...formData, showQrLabel: e.target.checked})}
                          className="w-5 h-5 rounded-lg border-outline-variant text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-bold text-primary uppercase">Show QR Label</span>
                      </label>
                      <p className="text-[10px] text-on-surface-variant ml-1">Show "Scan to Verify" label under QR code.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">Custom Tests</h3>
                  <p className="text-sm text-on-surface-variant">Add new individual tests or test groups (like CBC).</p>
                </div>
                
                <div className="space-y-4">
                  {customTests.map((test, idx) => (
                    <div key={idx} className="p-4 border border-outline-variant/30 rounded-2xl bg-surface-container-low flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-primary flex items-center gap-2">
                           {test.name} {test.isGroup && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Group</span>}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1">Category: {test.category}</p>
                        {!test.isGroup && test.unit && <p className="text-xs text-on-surface-variant">Unit: {test.unit}</p>}
                        {!test.isGroup && test.ranges?.general?.text && <p className="text-xs text-on-surface-variant">Range: {test.ranges.general.text}</p>}
                        {test.isGroup && <p className="text-xs text-on-surface-variant mt-1">Includes: {test.includedTests?.join(', ')}</p>}
                      </div>
                      <button onClick={() => setCustomTests(tests => tests.filter((_, i) => i !== idx))} className="text-error hover:bg-error-container p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {customTests.length === 0 && (
                    <div className="text-center py-8 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/30 rounded-2xl">
                      No custom tests added yet.
                    </div>
                  )}

                  <div className="mt-6 border-t border-outline-variant/20 pt-6">
                     <h4 className="font-bold text-primary mb-4">Add New Test</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-black text-primary uppercase ml-1">Type</label>
                           <select 
                             value={newTestDraft.isGroup ? 'group' : 'individual'} 
                             onChange={e => setNewTestDraft({...newTestDraft, isGroup: e.target.value === 'group'})}
                             className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none"
                           >
                             <option value="individual">Individual Test</option>
                             <option value="group">Test Group</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-primary uppercase ml-1">Test/Group Name</label>
                          <input type="text" value={newTestDraft.name} onChange={e => setNewTestDraft({...newTestDraft, name: e.target.value})} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-primary uppercase ml-1">Category</label>
                          <input type="text" value={newTestDraft.category} onChange={e => setNewTestDraft({...newTestDraft, category: e.target.value})} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none" />
                        </div>
                        {!newTestDraft.isGroup && (
                          <>
                            <div className="space-y-1">
                              <label className="text-xs font-black text-primary uppercase ml-1">Unit</label>
                              <select 
                                value={newTestDraft.unit} 
                                onChange={e => setNewTestDraft({...newTestDraft, unit: e.target.value})} 
                                className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none"
                              >
                                <option value="">— None —</option>
                                <option value="%">%</option>
                                <option value="mg/dL">mg/dL</option>
                                <option value="g/dL">g/dL</option>
                                <option value="gm/dl">gm/dl</option>
                                <option value="gm%">gm%</option>
                                <option value="x10³/Cu.mm">x10³/Cu.mm</option>
                                <option value="mill/cumm">mill/cumm</option>
                                <option value="lakh/cumm">lakh/cumm</option>
                                <option value="fL">fL</option>
                                <option value="pg">pg</option>
                                <option value="titer">titer</option>
                                <option value="/HPF">/HPF</option>
                                <option value="/LPF">/LPF</option>
                                <option value="U/L">U/L</option>
                                <option value="unit/l">unit/l</option>
                                <option value="mm">mm</option>
                                <option value="min">min</option>
                                <option value="sec">sec</option>
                                <option value="IU/mL">IU/mL</option>
                                <option value="mm induration">mm induration</option>
                              </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-xs font-black text-primary uppercase ml-1">Reference Range</label>
                              <div className="flex gap-2">
                                <input type="text" placeholder="Lower" value={newTestDraft.rangeLower} onChange={e => setNewTestDraft({...newTestDraft, rangeLower: e.target.value})} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none" />
                                <span className="flex items-center text-on-surface-variant">-</span>
                                <input type="text" placeholder="Higher" value={newTestDraft.rangeUpper} onChange={e => setNewTestDraft({...newTestDraft, rangeUpper: e.target.value})} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none" />
                              </div>
                            </div>
                          </>
                        )}
                     </div>
                     {newTestDraft.isGroup && (
                       <div className="mt-4 space-y-1">
                         <label className="text-xs font-black text-primary uppercase ml-1">Tests to Include (comma separated exact names)</label>
                         <textarea value={newTestDraft.includedTestsStr} onChange={e => setNewTestDraft({...newTestDraft, includedTestsStr: e.target.value})} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl outline-none resize-none min-h-[80px]" placeholder="e.g. Hemoglobin, WBC Count" />
                       </div>
                     )}
                     <button 
                       onClick={() => {
                          if (!newTestDraft.name) return;
                          
                          const test: any = {
                            id: `custom_${Date.now()}`,
                            name: newTestDraft.name,
                            category: newTestDraft.category || 'CUSTOM',
                            isGroup: newTestDraft.isGroup
                          };
                          
                          if (newTestDraft.isGroup) {
                            test.includedTests = newTestDraft.includedTestsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
                          } else {
                            test.unit = newTestDraft.unit;
                            const rangeStr = (newTestDraft.rangeLower || newTestDraft.rangeUpper) 
                               ? `${newTestDraft.rangeLower || ''} - ${newTestDraft.rangeUpper || ''}`.replace(/^ - | - $/g, '') 
                               : '';
                            test.ranges = { general: { text: rangeStr } };
                          }
                          
                          setCustomTests([...customTests, test]);
                          setNewTestDraft({ isGroup: false, name: '', category: '', unit: '', rangeLower: '', rangeUpper: '', includedTestsStr: '' });
                       }}
                       className="mt-4 flex items-center gap-2 px-4 py-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 rounded-xl font-bold text-primary transition-all text-sm"
                     >
                        <Plus className="w-4 h-4" /> Add to List
                     </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">Security</h3>
                  <p className="text-sm text-on-surface-variant">Manage your password and account protection.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl space-y-4">
                    <h4 className="font-bold text-primary flex items-center gap-2">
                      <KeyRound className="w-4 h-4" /> Change Password
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="password" placeholder="Current Password" className="w-full px-4 py-2 bg-white border border-outline-variant/30 rounded-xl outline-none" />
                      <input type="password" placeholder="New Password" className="w-full px-4 py-2 bg-white border border-outline-variant/30 rounded-xl outline-none" />
                    </div>
                    <button className="px-4 py-2 bg-surface-container hover:bg-outline-variant/20 text-on-surface text-sm font-bold rounded-xl transition-all border border-outline-variant/30">
                      Update Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-primary">Two-Factor Authentication</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.twoFactor}
                        onChange={() => setFormData({...formData, twoFactor: !formData.twoFactor})}
                      />
                      <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Footer */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  saved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary-container hover:opacity-90 text-white shadow-md'
                }`}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="w-5 h-5" /> Saved Successfully
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
