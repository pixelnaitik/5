import { useState, useEffect } from 'react';
import React from 'react';
import CryptoJS from 'crypto-js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FilePlus, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  FileText, 
  Printer, 
  Download,
  ShieldCheck, 
  X, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  MoreVertical,
  Share2
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { getPathologyTests, getReferenceRangeLabel, getReferenceRangeValues, findTestInfo, searchPathologyTests } from '../../lib/pathology-tests';
import { generateDefaultTemplateImage } from '../../lib/default-template';

const recalculateCBC = (results: Record<string, string>, changedName: string, changedValue: string): Record<string, string> => {
  const updatedResults = { ...results, [changedName]: changedValue };

  const isWBCParam = ['WHITE CELL COUNT(TC)', 'NEUTROPHIL', 'LYMPHOCYTE', 'MONOCYTE', 'EOSINOPHIL', 'BASOPHIL'].includes(changedName);
  const isRBCParam = ['RBC (RED BLOOD CELLS)', 'HB (HAEMOGLOBIN)', 'HCT(PCV)'].includes(changedName);

  if (isWBCParam) {
    const wbc = parseFloat(updatedResults['WHITE CELL COUNT(TC)']);
    if (!isNaN(wbc) && wbc > 0) {
      const neutrino = parseFloat(updatedResults['NEUTROPHIL']);
      if (!isNaN(neutrino)) {
        updatedResults['ABSOLUTE NEUTROPHIL COUNT'] = (neutrino / 100 * wbc).toFixed(2);
      }
      const lympho = parseFloat(updatedResults['LYMPHOCYTE']);
      if (!isNaN(lympho)) {
        updatedResults['ABSOLUTE LYMPHOCYTE COUNT'] = (lympho / 100 * wbc).toFixed(2);
      }
      const mono = parseFloat(updatedResults['MONOCYTE']);
      if (!isNaN(mono)) {
        updatedResults['ABSOLUTE MONOCYTE COUNT'] = (mono / 100 * wbc).toFixed(2);
      }
      const eosino = parseFloat(updatedResults['EOSINOPHIL']);
      if (!isNaN(eosino)) {
        updatedResults['ABSOLUTE EOSINOPHILL COUNT'] = (eosino / 100 * wbc).toFixed(2);
      }
      const baso = parseFloat(updatedResults['BASOPHIL']);
      if (!isNaN(baso)) {
        updatedResults['ABSOLUTE BASOPHIL COUNT'] = (baso / 100 * wbc).toFixed(2);
      }
    }
  }

  if (isRBCParam) {
    const rbc = parseFloat(updatedResults['RBC (RED BLOOD CELLS)']);
    const hb = parseFloat(updatedResults['HB (HAEMOGLOBIN)']);
    const hct = parseFloat(updatedResults['HCT(PCV)']);

    if (!isNaN(rbc) && !isNaN(hct) && rbc > 0) {
      updatedResults['MCV'] = (hct * 10 / rbc).toFixed(1);
    }
    if (!isNaN(rbc) && !isNaN(hb) && rbc > 0) {
      updatedResults['MCH'] = (hb * 10 / rbc).toFixed(1);
    }
    if (!isNaN(hb) && !isNaN(hct) && hct > 0) {
      updatedResults['MCHC'] = (hb * 100 / hct).toFixed(1);
    }
  }

  return updatedResults;
};

function serializeDeterministic(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
      return '[' + obj.map(serializeDeterministic).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const parts = keys.map(k => JSON.stringify(k) + ':' + serializeDeterministic(obj[k]));
  return '{' + parts.join(',') + '}';
}

function generateClientSignature(reportData: any): string {
  const secret = (import.meta as any).env.VITE_REPORT_SECRET_KEY || "default_secret_key_change_me";
  const dataString = serializeDeterministic(reportData);
  return CryptoJS.HmacSHA256(dataString, secret).toString(CryptoJS.enc.Hex);
}

const isNumericTest = (testInfo: any): boolean => {
  if (!testInfo || testInfo.isGroup || testInfo.isHeader) return false;
  if (testInfo.options && testInfo.options.length > 0) return false;
  
  const ranges = testInfo.ranges || {};
  const hasNumericRanges = [ranges.general, ranges.male, ranges.female, ranges.child].some((r: any) => {
    if (!r) return false;
    if (typeof r.min === 'number' || typeof r.max === 'number') return true;
    if (r.text) {
      const cleanedText = r.text.trim().toLowerCase();
      if (['negative', 'positive', 'non-reactive', 'reactive', 'few', 'absent', 'present'].includes(cleanedText)) return false;
      if (/[0-9]/.test(r.text)) return true;
    }
    return false;
  });

  if (hasNumericRanges) return true;

  if (testInfo.unit) {
    const unitLower = testInfo.unit.toLowerCase().trim();
    if (['', 'negative', 'positive', 'titer'].includes(unitLower)) return false;
    return true;
  }

  return false;
};

export default function ReportsPage() {
  const { user, role } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportToDelete, setReportToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (e.target instanceof HTMLSelectElement) {
         if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll('.test-result-input')) as HTMLElement[];
            const currentIndex = inputs.indexOf(e.target as HTMLElement);
            if (currentIndex !== -1 && currentIndex + 1 < inputs.length) {
               inputs[currentIndex + 1].focus();
            }
         }
         return;
      }

      const inputs = Array.from(document.querySelectorAll('.test-result-input')) as HTMLElement[];
      const currentIndex = inputs.indexOf(e.target as HTMLElement);
      if (currentIndex !== -1) {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextInput = inputs[currentIndex + 1];
          if (nextInput) nextInput.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevInput = inputs[currentIndex - 1];
          if (prevInput) prevInput.focus();
        }
      }
    }
  };

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [additionalTestSearchQuery, setAdditionalTestSearchQuery] = useState('');
  const [isAdditionalTestDropdownOpen, setIsAdditionalTestDropdownOpen] = useState(false);

  const [newReport, setNewReport] = useState({
    patientId: '',
    testSelection: [] as string[],
    results: {} as Record<string, string>,
  });

  useEffect(() => {
    const path = 'reports';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = 'patients';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModalError(null);
    try {
      if (!newReport.patientId) {
        throw new Error("No patient selected. Please search and select a patient first.");
      }

      // Ensure all selected tests have at least an empty string entry if not filled, to prevent undefined values in Firestore
      const sanitizedResults: Record<string, string> = {};
      newReport.testSelection.forEach(testName => {
        const testInfo = findTestInfo(testName);
        if (!testInfo?.isGroup && !testInfo?.isHeader) {
          sanitizedResults[testName] = newReport.results[testName] || '';
        }
      });

      const patient = patients.find(p => p.id === newReport.patientId);
      const timestamp = new Date().toISOString();
      
      // 1. Get report signature (Try backend first, fallback to client-side cryptography)
      let signature = '';
      try {
        const response = await fetch('/api/reports/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportData: {
              patientId: newReport.patientId,
              testSelection: newReport.testSelection,
              results: sanitizedResults,
              timestamp: timestamp
            } 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          signature = data.signature;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (signError) {
        console.warn("Backend signature endpoint unavailable. Generating client-side secure signature fallback:", signError);
        signature = generateClientSignature({
          patientId: newReport.patientId,
          testSelection: newReport.testSelection,
          results: sanitizedResults,
          timestamp: timestamp
        });
      }

      // 2. Save to Firestore
      const reportData = {
        patientId: newReport.patientId,
        patientName: patient?.name || 'Unknown',
        testSelection: newReport.testSelection,
        resultData: sanitizedResults,
        signature,
        status: 'final',
        createdAt: timestamp,
        createdBy: user?.uid,
        privateNotes: ''
      };
      
      const reportsPath = 'reports';
      let docRef;
      try {
        docRef = await addDoc(collection(db, reportsPath), reportData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, reportsPath);
        return; // Should not reach here due to throw
      }

      // 3. Create Invoice automatically
      const invoicesPath = 'invoices';
      try {
        await addDoc(collection(db, invoicesPath), {
          reportId: docRef.id,
          patientId: newReport.patientId,
          patientName: patient?.name || 'Unknown',
          amount: 250.00, // Fixed cost for demo
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Auto-invoice creation failed:", err);
      }

      setIsModalOpen(false);
      setNewReport({ patientId: '', testSelection: [], results: {} });
      setPatientSearchQuery('');
      setTestSearchQuery('');
      setModalError(null);
    } catch (err: any) {
      console.error(err);
      setModalError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!selectedReport) return;
    setSavingResults(true);
    try {
      // Re-sign data (Try backend first, fallback to client-side cryptography)
      let signature = '';
      try {
        const response = await fetch('/api/reports/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportData: {
              patientId: selectedReport.patientId,
              testSelection: selectedReport.testSelection,
              results: selectedReport.resultData,
              timestamp: selectedReport.createdAt
            } 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          signature = data.signature;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (signError) {
        console.warn("Backend signature endpoint unavailable. Generating client-side secure signature fallback for update:", signError);
        signature = generateClientSignature({
          patientId: selectedReport.patientId,
          testSelection: selectedReport.testSelection,
          results: selectedReport.resultData,
          timestamp: selectedReport.createdAt
        });
      }

      await updateDoc(doc(db, 'reports', selectedReport.id), {
        resultData: selectedReport.resultData,
        signature: signature
      });
      setSelectedReport(null);
      // Updating UI is handled by onSnapshot
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'reports');
    } finally {
      setSavingResults(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedReport) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'reports', selectedReport.id), {
        privateNotes: selectedReport.privateNotes || ''
      });
      setSelectedReport(null);
      // Updating UI is handled by onSnapshot
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'reports');
    } finally {
      setSavingNote(false);
    }
  };

  const patient_report = async (report: any, action: 'print' | 'download' | 'share' = 'print') => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const QRCode = await import('qrcode');
    const patient = patients.find(p => p.id === report.patientId) || { name: report.patientName, age: 'N/A', gender: 'N/A', doctorName: 'Self', id: report.patientId || '', createdAt: report.createdAt };
    
    const formattedPatientName = patient.name.toLowerCase().replace(/\s+/g, '_');
    const filename = `${formattedPatientName}_lab_report.pdf`;
    
    // Get template & margins from settings
    const savedSettings = localStorage.getItem('pathologyos_settings');
    let template = 'blank';
    let labName = 'Healthcare OS Report';
    let customMarginTop = 50;
    let customMarginBottom = 20;
    let customMarginLeft = 8;
    let customMarginRight = 15;
    let reportTitleFontSize = 20;
    let patientInfoFontSize = 12;
    let patientLineHeight = 6.0;
    let reportSectionGap = 5;
    let tableTitleFontSize = 12;
    let tableHeaderFontSize = 12;
    let tableBodyFontSize = 12;
    let tableCellPadding = 1.2;
    let notesFontSize = 9;
    let footerFontSize = 10;
    let reportQrCodeSize = 15;
    let qrLabelFontSize = 7;
    let reportQrColor = '#d65c46';
    let reportQrY = 1;
    let reportQrX = 180;
    let showQrLabel = true;
    let qrLabelSpacing = 3.5;
    let sharingTemplateImage = '';

    if (savedSettings) {
       try {
          const s = JSON.parse(savedSettings);
          // Auto-migrate old default margins (20/10/40/15) to new standard values (50/20/8/15)
          if (s.reportMarginTop === 20 || s.reportMarginTop === 40) s.reportMarginTop = 50;
          if (s.reportMarginBottom === 10) s.reportMarginBottom = 20;
          if (s.reportMarginLeft === 15) s.reportMarginLeft = 8;

          if (action === 'share') {
             template = s.shareTemplate || s.reportTemplate || 'blank';
             if (s.shareMarginTop !== undefined) customMarginTop = s.shareMarginTop;
             if (s.shareMarginBottom !== undefined) customMarginBottom = s.shareMarginBottom;
             if (s.shareMarginLeft !== undefined) customMarginLeft = s.shareMarginLeft;
             if (s.shareMarginRight !== undefined) customMarginRight = s.shareMarginRight;
             
             const shareBodyFont = s.shareTableBodyFontSize ?? s.tableBodyFontSize ?? 12;
             tableBodyFontSize = shareBodyFont;
          } else {
             template = s.reportTemplate || 'blank';
             if (s.reportMarginTop !== undefined) customMarginTop = s.reportMarginTop;
             if (s.reportMarginBottom !== undefined) customMarginBottom = s.reportMarginBottom;
             if (s.reportMarginLeft !== undefined) customMarginLeft = s.reportMarginLeft;
             if (s.reportMarginRight !== undefined) customMarginRight = s.reportMarginRight;
             
             const reportBodyFont = s.reportTableBodyFontSize ?? s.tableBodyFontSize ?? 12;
             tableBodyFontSize = reportBodyFont;
          }

          if (s.labName) {
            labName = template === 'classic' ? s.labName.toUpperCase() : s.labName;
          }
          if (s.reportTitleFontSize !== undefined) reportTitleFontSize = s.reportTitleFontSize;
          if (s.patientInfoFontSize !== undefined) patientInfoFontSize = s.patientInfoFontSize;
          if (s.patientLineHeight !== undefined) patientLineHeight = s.patientLineHeight;
          if (s.reportSectionGap !== undefined) reportSectionGap = s.reportSectionGap;
          if (s.tableTitleFontSize !== undefined) tableTitleFontSize = s.tableTitleFontSize;
          if (s.tableHeaderFontSize !== undefined) tableHeaderFontSize = s.tableHeaderFontSize;
          if (s.tableBodyFontSize !== undefined) tableBodyFontSize = s.tableBodyFontSize;
          if (s.tableCellPadding !== undefined) tableCellPadding = s.tableCellPadding;
          if (s.notesFontSize !== undefined) notesFontSize = s.notesFontSize;
          if (s.footerFontSize !== undefined) footerFontSize = s.footerFontSize;
          if (s.reportQrCodeSize !== undefined) reportQrCodeSize = s.reportQrCodeSize;
          if (s.qrLabelFontSize !== undefined) qrLabelFontSize = s.qrLabelFontSize;
          if (s.reportQrColor !== undefined) reportQrColor = s.reportQrColor;
          if (s.reportQrY !== undefined) reportQrY = s.reportQrY;
          if (s.reportQrX !== undefined) reportQrX = s.reportQrX;
          if (s.showQrLabel !== undefined) showQrLabel = s.showQrLabel;
          if (s.qrLabelSpacing !== undefined) qrLabelSpacing = s.qrLabelSpacing;
          if (s.sharingTemplateImage !== undefined) sharingTemplateImage = s.sharingTemplateImage;
       } catch (e) {}
    }

    if (action === 'share' && !sharingTemplateImage) {
      try {
        const loadDefaultShareImage = (): Promise<string> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
              } else {
                resolve(generateDefaultTemplateImage(labName));
              }
            };
            img.onerror = () => {
              resolve(generateDefaultTemplateImage(labName));
            };
            img.src = '/default-share-template.png';
          });
        };
        sharingTemplateImage = await loadDefaultShareImage();
      } catch (e) {
        console.error("Failed to load default sharing template background", e);
        sharingTemplateImage = generateDefaultTemplateImage(labName);
      }
    } else if (!sharingTemplateImage) {
      try {
        sharingTemplateImage = generateDefaultTemplateImage(labName);
      } catch (e) {
        console.error("Failed to generate default sharing template background", e);
      }
    }

    // Pre-generate QR Code URL (Option 1: Short verify URL without signature payload)
    let qrDataUrl: string | null = null;
    try {
      const verifyUrl = `${window.location.origin}/verify?id=${report.id}`;
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { 
        margin: 1, 
        scale: 8,
        color: {
          dark: reportQrColor,
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error("Could not generate QR code:", err);
    }

    // Wrapped PDF generation logic to support standard rendering and Option C compact rendering
    const generatePdf = (compactMode: boolean = false) => {
      const doc = new jsPDF();
      doc.setProperties({
        title: filename
      });

      // Apply compacted parameters if compactMode is enabled
      let cellPadding = tableCellPadding;
      let bodyFontSize = tableBodyFontSize;
      let headerFontSize = tableHeaderFontSize;
      let sectionGap = reportSectionGap;
      let ptLineHeight = patientLineHeight;
      let mTop = customMarginTop;
      let mBottom = customMarginBottom;
      let mLeft = customMarginLeft;
      let mRight = customMarginRight;

      if (compactMode) {
         cellPadding = Math.max(0.6, tableCellPadding - 0.45);
         bodyFontSize = Math.max(7.5, tableBodyFontSize - 0.7);
         headerFontSize = Math.max(7.5, tableHeaderFontSize - 0.7);
         sectionGap = Math.max(3, reportSectionGap - 2);
         ptLineHeight = Math.max(4.0, patientLineHeight - 1.0);
         mTop = Math.max(25, customMarginTop - 8);
         mBottom = Math.max(12, customMarginBottom - 5);
      }

      const totalWidth = 210 - mLeft - mRight;
      const col0Width = totalWidth * (70 / 180);
      const col1Width = totalWidth * (30 / 180);
      const col2Width = totalWidth * (35 / 180);
      const col3Width = totalWidth * (45 / 180);

      // Function to draw the complete header including lab name, patient info, and table columns header
      const drawFullHeader = () => {
        // Draw custom background template when sharing if provided
        if (action === 'share' && sharingTemplateImage) {
           try {
              const format = sharingTemplateImage.substring(sharingTemplateImage.indexOf('/') + 1, sharingTemplateImage.indexOf(';')).toUpperCase();
              doc.addImage(sharingTemplateImage, format === 'PNG' ? 'PNG' : 'JPEG', 0, 0, 210, 297);
           } catch (e) {
              console.error("Failed to draw sharing template image", e);
           }
        }

        let currentY = mTop;
        
        // 1. Lab Header
        if (template === 'minimalist') {
           doc.setFontSize(reportTitleFontSize - 4);
           doc.setTextColor(0);
           doc.setFont('helvetica', 'normal');
           doc.text(labName, mLeft, currentY);
           doc.setDrawColor(0);
           doc.setLineWidth(0.5);
           doc.line(mLeft, currentY + 3, 210 - mRight, currentY + 3);
           currentY += sectionGap;
        } else if (template === 'classic') {
           doc.setFontSize(reportTitleFontSize + 2);
           doc.setTextColor(0, 0, 0);
           doc.setFont('helvetica', 'bold');
           doc.text(labName, 105, currentY + 5, { align: 'center' });
           doc.setDrawColor(0);
           doc.setLineWidth(0.5);
           doc.line(mLeft - 5, currentY + 10, 210 - mRight + 5, currentY + 10);
           currentY += sectionGap * 2;
        } else if (template === 'blank') {
           currentY += sectionGap;
        } else {
           // Modern
           doc.setFontSize(reportTitleFontSize);
           doc.setTextColor(11, 60, 93);
           doc.setFont('helvetica', 'bold');
           doc.text(labName, 105, currentY, { align: 'center' });
           currentY += sectionGap * 1.5;
        }
        
        // 2. Patient Details
        let startY = currentY + 4;
        const lh = ptLineHeight; 
        
        const ptNameLines = doc.splitTextToSize(`: ${patient.name || ''}`, totalWidth * (55 / 180));
        const nameHeightOffset = (ptNameLines.length - 1) * ptLineHeight;
        
        const boxTop = startY - 12;
        const boxHeight = (lh * 2) + nameHeightOffset + 15;

        if (template === 'modern') {
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(mLeft - 5, boxTop, totalWidth + 10, boxHeight, 2, 2, 'FD'); 
        } else if (template === 'classic') {
          doc.setDrawColor(0);
          doc.rect(mLeft - 5, boxTop, totalWidth + 10, boxHeight, 'S'); 
        }

        doc.setFontSize(patientInfoFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);

        // Left column
        doc.text('Patient Name', mLeft, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(ptNameLines, mLeft + 27, startY);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Ref By', mLeft, startY + lh + nameHeightOffset);
        doc.text('Patient ID', mLeft, startY + (lh * 2) + nameHeightOffset);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${patient.doctorName || 'Self'}`, mLeft + 27, startY + lh + nameHeightOffset);
        doc.text(`: ${patient.id ? patient.id.substring(0, 8).toUpperCase() : 'N/A'}`, mLeft + 27, startY + (lh * 2) + nameHeightOffset);
        
        // Middle column (Age, Sex, Reported on) - shifted slightly to the right
        const formatDateTime = (isoString: string) => {
          if (!isoString) return '';
          const d = new Date(isoString);
          return `${d.toLocaleDateString('en-IN').replace(/\//g, '-')} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        };

        doc.setFont('helvetica', 'bold');
        
        doc.text('Age', mLeft + 97, startY);
        doc.text('Sex', mLeft + 97, startY + lh + nameHeightOffset);
        doc.text('Reported on', mLeft + 97, startY + (lh * 2) + nameHeightOffset);
        
        doc.setFont('helvetica', 'normal');
        
        doc.text(`: ${patient.age} Years`, mLeft + 120, startY);
        doc.text(`: ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, mLeft + 120, startY + lh + nameHeightOffset);
        const repDate = formatDateTime(report.createdAt);
        doc.text(`: ${repDate}`, mLeft + 120, startY + (lh * 2) + nameHeightOffset);

        // QR Code drawn at the side of Age, Sex, Reported on (aligned to the right, and vertically matching Reported on)
        if (qrDataUrl) {
          const reportedOnY = startY + (lh * 2) + nameHeightOffset;
          const qrY = reportedOnY - reportQrCodeSize - qrLabelSpacing;
          const qrX = 210 - mRight - reportQrCodeSize - 3;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, reportQrCodeSize, reportQrCodeSize);
          if (showQrLabel) {
            doc.setFontSize(qrLabelFontSize);
            doc.setFont('helvetica', 'bold');
            if (template === 'classic') {
              doc.setTextColor(0);
            } else {
              doc.setTextColor(11, 60, 93);
            }
            doc.text('Scan to Verify', qrX + reportQrCodeSize / 2, reportedOnY, { align: 'center' });
          }
        }

        // 4. Table Columns Header
        let columnsHeaderY = startY + Math.max(lh * 3, (lh * 2) + nameHeightOffset) + sectionGap + 5;
        
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(mLeft, columnsHeaderY - 5, 210 - mRight, columnsHeaderY - 5);
        
        doc.setFontSize(tableHeaderFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        
        const headerX0 = mLeft + 1.5;
        const headerX1 = mLeft + col0Width + 1.5;
        const headerX2 = mLeft + col0Width + col1Width + 1.5;
        const headerX3 = mLeft + col0Width + col1Width + col2Width + 1.5;
        
        doc.text('TEST DESCRIPTION', headerX0, columnsHeaderY);
        doc.text('RESULT', headerX1, columnsHeaderY);
        doc.text('UNITS', headerX2, columnsHeaderY);
        doc.text('REFERENCE RANGE', headerX3, columnsHeaderY);
        doc.line(mLeft, columnsHeaderY + 2, 210 - mRight, columnsHeaderY + 2);

        return columnsHeaderY + 3; // return finalY to start writing table rows
      };

      // Draw the first page header immediately
      let finalY = drawFullHeader();

      const pagesWithHeader = new Set<number>();
      pagesWithHeader.add((doc.internal as any).getCurrentPageInfo().pageNumber);

      const onDidDrawPage = () => {
         const pageNum = (doc.internal as any).getCurrentPageInfo().pageNumber;
         if (!pagesWithHeader.has(pageNum)) {
             drawFullHeader();
             pagesWithHeader.add(pageNum);
         }
      };

      // Use the finalY from full header as our top margin, so subsequent pages start correctly below the header
      const autoTableMarginTop = finalY;

      // Group tests by category
      const testsByCategory: Record<string, string[]> = {};
      
      (report.testSelection || []).forEach((testName: string) => {
        if (testName === 'DIFFERENTIAL COUNT WBC' || testName === 'DIFFERENTIAL LEUCOCYTE ABSOLUTE COUNT') {
          return;
        }
        const testInfo = findTestInfo(testName);
        const category = testInfo?.category || 'GENERAL';
        if (!testsByCategory[category]) testsByCategory[category] = [];
        testsByCategory[category].push(testName);
      });

      if (report.resultData) {
        Object.keys(report.resultData).forEach((testName) => {
          if (testName === 'DIFFERENTIAL COUNT WBC' || testName === 'DIFFERENTIAL LEUCOCYTE ABSOLUTE COUNT') {
            return;
          }
          if (!(report.testSelection || []).includes(testName)) {
             const testInfo = findTestInfo(testName);
             const category = testInfo?.category || 'GENERAL';
             if (!testsByCategory[category]) testsByCategory[category] = [];
             testsByCategory[category].push(testName);
          }
        });
      }

      const buildTableDataForCategories = (categoriesList: string[]) => {
        const data: any[] = [];
        categoriesList.forEach(category => {
          if (!testsByCategory[category] || testsByCategory[category].length === 0) return;

          // Add Category Header
          data.push([{ 
              content: category.toUpperCase(), colSpan: 4, 
              styles: { 
                fontStyle: 'bold', 
                fillColor: false, 
                textColor: [0, 0, 0], 
                cellPadding: { top: Math.max(1.5, cellPadding * 2.5), bottom: Math.max(1.5, cellPadding * 2.5), left: 2 },
                halign: 'center'
              } 
          }]);

          // Add tests for this category
          testsByCategory[category].forEach(testName => {
            const testInfo = findTestInfo(testName);
            if (testInfo?.isGroup || testInfo?.isHeader) {
                const hasBackground = testInfo.isGroup && template !== 'classic';
                data.push([{ 
                    content: testName, colSpan: 4, 
                    styles: { 
                      fontStyle: 'bold', 
                      fillColor: hasBackground ? [248, 250, 252] : false, 
                      textColor: template === 'classic' ? [0,0,0] : [11, 60, 93], 
                      cellPadding: { top: Math.max(1.5, cellPadding * 1.8), bottom: Math.max(1.5, cellPadding * 1.8), left: 2 },
                      halign: testInfo.isGroup ? 'center' : 'left'
                    } 
                }]);
                return;
            }

            const result = report.resultData[testName] || '';
            const refRangeLabel = testInfo ? getReferenceRangeLabel(testInfo.ranges, parseInt(patient.age), patient.gender) : '';
            const refValues = testInfo ? getReferenceRangeValues(testInfo.ranges, parseInt(patient.age), patient.gender) : null;
            const unit = testInfo?.unit || '';
            const method = testInfo?.method ? `\nMethod: ${testInfo.method}` : '';
            
            let formattedResult: any = result;
            if (result && refValues && !isNaN(Number(result))) {
              const numResult = Number(result);
              let isBold = false, suffix = '';
              if (refValues.min !== undefined && numResult < refValues.min) { isBold = true; suffix = '__DOWN__'; } 
              else if (refValues.max !== undefined && numResult > refValues.max) { isBold = true; suffix = '__UP__'; }
              if (isBold) formattedResult = { content: result + suffix, styles: { fontStyle: 'bold' } };
            }
            data.push([testName + method, formattedResult, unit, refRangeLabel]);
          });
        });
        return data;
      };

      const commonTableOpts = {
        theme: 'plain' as const,
        showHead: false, 
        pageBreak: 'auto' as const,
        margin: { top: autoTableMarginTop, left: mLeft, right: mRight, bottom: mBottom },
        styles: { cellPadding: cellPadding, fontSize: bodyFontSize, textColor: 0 },
        columnStyles: {
          0: { cellWidth: col0Width },
          1: { cellWidth: col1Width },
          2: { cellWidth: col2Width },
          3: { cellWidth: col3Width },
        },
        didParseCell: function(data: any) {
          if (data.section === 'body' && data.column.index === 1) {
             if (data.cell.raw && typeof data.cell.raw === 'object' && 'content' in data.cell.raw) {
               const content = String((data.cell.raw as any).content);
               if (content.includes('__UP__')) {
                  data.cell.text[0] = content.replace('__UP__', '').trim();
                  (data.cell as any).drawArrow = 'up';
               } else if (content.includes('__DOWN__')) {
                  data.cell.text[0] = content.replace('__DOWN__', '').trim();
                  (data.cell as any).drawArrow = 'down';
               }
             }
          }
        },
        didDrawCell: function(data: any) {
          if (data.section === 'body' && data.column.index === 1 && (data.cell as any).drawArrow) {
               const isHigh = (data.cell as any).drawArrow === 'up';
               doc.setFontSize(bodyFontSize + 0.8);
               doc.setFont('helvetica', 'bold');
               const textWidth = doc.getTextWidth(data.cell.text[0] || '');
               let padding = 3;
               if (typeof data.cell.styles.cellPadding === 'number') {
                  padding = data.cell.styles.cellPadding;
               } else if (data.cell.styles.cellPadding && typeof data.cell.styles.cellPadding === 'object') {
                  padding = (data.cell.styles.cellPadding as any).left || 3;
               }
               const x = data.cell.x + padding + textWidth + 3;
               const y = data.cell.y + data.cell.height / 2;
               
               doc.setFillColor(0, 0, 0);
               doc.setDrawColor(0);
               doc.setLineWidth(0.4);
               const w = 1.0; 
               const hh = 1.2; 
               
               if (isHigh) {
                 doc.line(x + w/2, y + 1.5, x + w/2, y - 1.5 + hh);
                 doc.triangle(x, y - 1.5 + hh, x + w/2, y - 1.5, x + w, y - 1.5 + hh, 'FD');
               } else {
                 doc.line(x + w/2, y - 1.5, x + w/2, y + 1.5 - hh);
                 doc.triangle(x, y + 1.5 - hh, x + w/2, y + 1.5, x + w, y + 1.5 - hh, 'FD');
               }
          }
        },
        didDrawPage: onDidDrawPage
      };

      const availableCategories = Object.keys(testsByCategory);
      const blocks: { categories: string[] }[] = [];

      const otherCategories = availableCategories.filter(
        c => c !== 'HAEMATOLOGY' && c !== 'CLINICAL PATHOLOGY'
      );
      if (otherCategories.length > 0) {
        blocks.push({ categories: otherCategories });
      }

      if (availableCategories.includes('HAEMATOLOGY')) {
        blocks.push({ categories: ['HAEMATOLOGY'] });
      }

      if (availableCategories.includes('CLINICAL PATHOLOGY')) {
        blocks.push({ categories: ['CLINICAL PATHOLOGY'] });
      }

      let isFirstBlock = true;
      blocks.forEach(block => {
        const blockData = buildTableDataForCategories(block.categories);
        if (blockData.length === 0) return;

        if (!isFirstBlock) {
          doc.addPage();
          const newPageNum = (doc.internal as any).getCurrentPageInfo().pageNumber;
          finalY = drawFullHeader();
          pagesWithHeader.add(newPageNum);
        } else {
          isFirstBlock = false;
        }

        autoTable(doc, {
          startY: finalY,
          body: blockData,
          ...commonTableOpts
        });
        finalY = (doc as any).lastAutoTable.finalY + Math.max(sectionGap, 8);
      });

      // Keep track of which page the last actual test row rendered on
      const lastTestPage = (doc.internal as any).getCurrentPageInfo().pageNumber;

      finalY += 4;
      
      const checkPageBreak = (neededHeight: number) => {
         if (finalY + neededHeight > 297 - mBottom) {
            doc.addPage();
            const pageNum = (doc.internal as any).getCurrentPageInfo().pageNumber;
            if (!pagesWithHeader.has(pageNum)) {
                drawFullHeader();
                pagesWithHeader.add(pageNum);
            }
            finalY = autoTableMarginTop + 2;
         }
      };

      checkPageBreak(5);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(mLeft, finalY, 210 - mRight, finalY);
      finalY += 10;

      // Draw clinical significance or notes
      const testsWithNotes = (report.testSelection || []).map((t: string) => findTestInfo(t)).filter((t: any) => t?.notes || t?.clinicalSignificance);
      
      if (testsWithNotes.length > 0) {
         doc.setFontSize(notesFontSize);
         testsWithNotes.forEach((testInfo: any) => {
           doc.setFont('helvetica', 'bold');
           
           if (testInfo.notes && testInfo.notes.length > 0) {
             checkPageBreak(5 + testInfo.notes.length * 4.5);
             doc.text('NOTE-', mLeft, finalY);
             finalY += 4;
             doc.setFont('helvetica', 'normal');
             testInfo.notes.forEach((note: string) => {
               doc.text(note, mLeft, finalY);
               finalY += 4.5;
             });
             finalY += 2;
           }
           
           if (testInfo.clinicalSignificance) {
             const splitText = doc.splitTextToSize(testInfo.clinicalSignificance, totalWidth);
             checkPageBreak(8 + splitText.length * 4.5);
             doc.setFont('helvetica', 'bold');
             doc.text('Clinical significance :', mLeft, finalY);
             finalY += 4;
             doc.setFont('helvetica', 'normal');
             doc.text(splitText, mLeft, finalY);
             finalY += splitText.length * 4.5 + 5;
           }
         });
         
         checkPageBreak(5);
         doc.setDrawColor(0);
         doc.setLineWidth(0.5);
         doc.line(mLeft, finalY, 210 - mRight, finalY);
         finalY += 10;
      }
      
      checkPageBreak(10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(footerFontSize);
      doc.text('*** End of Report ***', 105, finalY, { align: 'center' });

      return { doc, lastTestPage };
    };

    // First Rendering Pass (Standard settings)
    let { doc, lastTestPage } = generatePdf(false);
    const totalPages = (doc.internal as any).getNumberOfPages();

    // Option C: If only "End of Report" or note sections spilled over onto a new page,
    // re-run in compactMode to auto-shrink the vertical coordinates and pull them back onto the preceding page.
    if (totalPages > 1 && lastTestPage === totalPages - 1) {
       const compacted = generatePdf(true);
       doc = compacted.doc;
    }

    // Draw page numbers for all pages of the final selected PDF document
    const finalTotalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= finalTotalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(Math.max(8, footerFontSize - 2));
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${finalTotalPages}`, 105, 297 - 11, { align: 'center' });
    }

    if (action === 'print') {
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      const newWindow = window.open(blobUrl, '_blank');
      // Attempt to set title for print dialog if possible
      if (newWindow) {
        newWindow.document.title = filename;
      }
    } else if (action === 'share') {
      try {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        const text = `Diagnostic Report for ${patient.name}`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Diagnostic Report',
            text: text,
          });
        } else {
          // Fallback to downloading or WhatsApp directly (without file, since WhatsApp link doesn't support file attachment directly)
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\nPlease find the PDF report attached.')}`;
          window.open(whatsappUrl, '_blank');
          doc.save(filename); // Provide the file via download so they can attach it manually
        }
      } catch (err) {
        console.error("Error sharing report:", err);
        // If sharing was aborted or failed, we can fallback to download
        doc.save(filename);
      }
    } else {
      doc.save(filename);
    }
  };

  const activeReportDates = new Set(
    reports.map(r => r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '')
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays, year, month };
  };

  const combinedList = [
    ...reports.map(r => ({ ...r, itemType: 'report', timestamp: r.createdAt })),
    ...patients
      .filter(p => !reports.some(r => r.patientId === p.id))
      .map(p => ({ ...p, itemType: 'patient', timestamp: p.createdAt }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredCombinedList = combinedList.filter(item => {
    const name = item.itemType === 'report' ? item.patientName : item.name;
    const matchesSearch = name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (() => {
      if (!item.createdAt) return true;
      const itemDateStr = new Date(item.createdAt).toISOString().split('T')[0];
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      return true;
    })();
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Filter reports by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>
          
          <div className="relative w-full sm:w-60 z-30">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary-container outline-none transition-all text-on-surface text-left font-semibold hover:bg-surface-container-low shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate text-sm text-on-surface-variant font-bold">
                  {(() => {
                    const format = (dStr: string) => {
                      try {
                        return new Date(dStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      } catch(e) {
                        return dStr;
                      }
                    };
                    if (!fromDate && !toDate) return 'All Dates';
                    if (fromDate && !toDate) return `From ${format(fromDate)}`;
                    if (!fromDate && toDate) return `To ${format(toDate)}`;
                    return `${format(fromDate)} - ${format(toDate)}`;
                  })()}
                </span>
              </div>
              {(fromDate || toDate) ? (
                <X 
                  className="w-4 h-4 text-on-surface-variant hover:text-error shrink-0 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFromDate('');
                    setToDate('');
                  }}
                />
              ) : (
                <ChevronRight className={cn("w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200", isCalendarOpen && "rotate-90")} />
              )}
            </button>
            
            <AnimatePresence>
              {isCalendarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 p-4 bg-white border border-outline-variant/30 shadow-xl rounded-3xl w-80 z-50 origin-top-right"
                  >
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm text-primary">
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Preset Buttons */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {[
                        { label: 'Today', range: 'today' },
                        { label: '7 Days', range: '7days' },
                        { label: '30 Days', range: '30days' },
                        { label: 'Month', range: 'thisMonth' }
                      ].map(preset => (
                        <button
                          key={preset.range}
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            if (preset.range === 'today') {
                              setFromDate(todayStr);
                              setToDate(todayStr);
                            } else if (preset.range === '7days') {
                              const past = new Date();
                              past.setDate(today.getDate() - 7);
                              setFromDate(past.toISOString().split('T')[0]);
                              setToDate(todayStr);
                            } else if (preset.range === '30days') {
                              const past = new Date();
                              past.setDate(today.getDate() - 30);
                              setFromDate(past.toISOString().split('T')[0]);
                              setToDate(todayStr);
                            } else if (preset.range === 'thisMonth') {
                              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                              setFromDate(startOfMonth.toISOString().split('T')[0]);
                              setToDate(todayStr);
                            }
                            setIsCalendarOpen(false);
                          }}
                          className="px-1 py-1 bg-surface-container-low text-[10px] font-bold text-primary rounded-md border border-outline-variant/20 hover:bg-primary/5 hover:border-primary/30 transition-all text-center"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <span key={day} className="text-[10px] font-bold text-on-surface-variant uppercase w-8 h-8 flex items-center justify-center select-none">
                          {day}
                        </span>
                      ))}
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {Array.from({ length: getDaysInMonth(viewDate).firstDayIndex }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="w-8 h-8" />
                      ))}
                      {Array.from({ length: getDaysInMonth(viewDate).totalDays }).map((_, idx) => {
                        const dNum = idx + 1;
                        const currentYear = viewDate.getFullYear();
                        const currentMonth = viewDate.getMonth();
                        const dIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                        
                        const isFrom = fromDate === dIso;
                        const isTo = toDate === dIso;
                        const isSelected = isFrom || isTo;
                        const inRange = fromDate && toDate && dIso >= fromDate && dIso <= toDate;
                        const hasReports = activeReportDates.has(dIso);
                        
                        return (
                          <button
                            key={`day-${dNum}`}
                            type="button"
                            onClick={() => {
                              if (!fromDate || (fromDate && toDate)) {
                                setFromDate(dIso);
                                setToDate('');
                              } else {
                                if (dIso < fromDate) {
                                  setFromDate(dIso);
                                  setToDate('');
                                } else {
                                  setToDate(dIso);
                                }
                              }
                            }}
                            className={cn(
                              "w-8 h-8 rounded-full text-xs font-bold transition-all flex flex-col items-center justify-center relative hover:bg-primary/20",
                              isSelected && "bg-primary text-white hover:bg-primary hover:text-white",
                              (!isSelected && inRange) && "bg-primary/10 text-primary hover:bg-primary/20",
                              (!isSelected && !inRange) && "text-on-surface"
                            )}
                          >
                            <span>{dNum}</span>
                            {hasReports && (
                              <span className={cn(
                                "w-1 h-1 rounded-full absolute bottom-1",
                                isSelected ? "bg-white" : "bg-primary"
                              )} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Calendar Footer / Actions */}
                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          setFromDate(todayStr);
                          setToDate(todayStr);
                          setViewDate(new Date());
                          setIsCalendarOpen(false);
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFromDate('');
                          setToDate('');
                          setIsCalendarOpen(false);
                        }}
                        className="text-on-surface-variant font-bold hover:underline"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        {role !== 'guest' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-primary-container text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FilePlus className="w-5 h-5" />
            New Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCombinedList.map((item) => {
          if (item.itemType === 'report') {
            const report = item;
            return (
          <motion.div 
            key={`report-${report.id}`}
            onClick={() => setSelectedReport({...report})}
            whileHover={{ y: -4 }}
            className="cursor-pointer bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed-dim/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 group-hover:bg-primary-container/5" />
            
            <div className="flex justify-between items-start mb-6 relative z-20">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary-container shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] font-black uppercase tracking-widest rounded-full">
                  {report.testType || 'Final'}
                </span>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === report.id ? null : report.id);
                    }}
                    className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {activeMenuId === report.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden z-30"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            patient_report(report, 'print');
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 border-b border-outline-variant/10"
                        >
                          <Printer className="w-4 h-4 text-on-surface-variant" />
                          Print
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportToDelete(report);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-error hover:bg-error-container/20 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-6 relative z-10">
              <h3 className="text-xl font-bold text-primary truncate">{report.patientName}</h3>
              <p className="text-xs text-on-surface-variant font-medium">Verified Pathology Report</p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Patient ID</span>
                <span className="text-xs font-mono font-bold text-primary">{report.patientId ? (report.patientId.length > 10 ? report.patientId.substring(0, 8) + '...' : report.patientId) : 'N/A'}</span>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => patient_report(report, 'download')}
                  className="p-2 bg-surface-container hover:bg-primary-container hover:text-white rounded-xl transition-all shadow-sm z-20"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => patient_report(report, 'share')}
                  className="p-2 bg-surface-container hover:bg-secondary text-secondary hover:text-white rounded-xl transition-all shadow-sm z-20"
                  title="Share Report"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
            );
          } else {
            const patient = item;
            return (
              <motion.div 
                key={`patient-${patient.id}`}
                onClick={() => {
                   setNewReport({
                     patientId: patient.id,
                     testSelection: patient.testSelection || [],
                     results: {}
                   });
                   setPatientSearchQuery(patient.name);
                   setIsModalOpen(true);
                }}
                whileHover={{ y: -4 }}
                className="cursor-pointer bg-white p-6 rounded-3xl border border-secondary/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-150 group-hover:bg-secondary/10" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-error-container/50 text-error font-black text-[10px] uppercase tracking-widest rounded-full">
                    Awaiting Report
                  </span>
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                  <h3 className="text-xl font-bold text-primary truncate">{patient.name}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Age: {patient.age}y • Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} {patient.testSelection?.length > 0 ? `• Tests: ${patient.testSelection.length}` : ''}</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10 relative z-10">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Registered</span>
                     <span className="text-xs font-mono font-bold text-primary">{new Date(patient.createdAt).toLocaleDateString()}</span>
                   </div>
                   <button className="text-xs font-bold bg-secondary text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                     <Plus className="w-3 h-3" /> Fill Details
                   </button>
                </div>
              </motion.div>
            );
          }
        })}
      </div>

      {/* Create Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-primary/20 backdrop-blur-sm shadow-2xl"
            onClick={() => {
              setIsModalOpen(false);
              setNewReport({ patientId: '', testSelection: [], results: {} });
              setPatientSearchQuery('');
              setTestSearchQuery('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-primary">Generate Diagnostic Report</h3>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setNewReport({ patientId: '', testSelection: [], results: {} });
                  setPatientSearchQuery('');
                  setTestSearchQuery('');
                  setModalError(null);
                }} className="p-2 hover:bg-surface-container rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form id="create-report-form" onSubmit={handleCreateReport} className="overflow-y-auto p-4 sm:p-6 space-y-6">
                {modalError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-start gap-2.5 shadow-sm text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">
                      <h5 className="font-bold">Failed to finalise report</h5>
                      <p className="text-xs mt-0.5 opacity-90">{modalError}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setModalError(null)} 
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="space-y-1 flex-1 relative">
                      <label className="text-xs font-black text-primary uppercase ml-1">Search & Select Patient</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                          required={!newReport.patientId}
                          type="text"
                          value={patientSearchQuery}
                          onChange={(e) => {
                            setPatientSearchQuery(e.target.value);
                            setIsPatientDropdownOpen(true);
                            if (newReport.patientId) {
                               setNewReport({ ...newReport, patientId: '' });
                            }
                          }}
                          onFocus={() => setIsPatientDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 200)}
                          className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-bold text-primary"
                          placeholder="Type to search patients..."
                        />
                        {isPatientDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto top-full left-0">
                            {(() => {
                               const filteredPatients = patients.filter(p => 
                                 p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) || 
                                 p.phone?.includes(patientSearchQuery)
                               );
                               return filteredPatients.length > 0 ? (
                                 filteredPatients.map(p => (
                                   <button
                                     key={p.id}
                                     type="button"
                                     onMouseDown={(e) => { 
                                       e.preventDefault(); 
                                       setNewReport({
                                         ...newReport, 
                                         patientId: p.id,
                                         testSelection: p.testSelection || []
                                       });
                                       setPatientSearchQuery(p.name);
                                       setIsPatientDropdownOpen(false);
                                     }}
                                     className="w-full text-left px-4 py-3 text-sm hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
                                   >
                                     <div className="flex justify-between items-center">
                                        <span className="font-bold">{p.name}</span>
                                        <span className="text-xs text-on-surface-variant">{p.phone}</span>
                                     </div>
                                   </button>
                                 ))
                               ) : (
                                 <div className="px-4 py-3 text-sm text-on-surface-variant text-center border-b border-outline-variant/5 last:border-0">
                                   No patients found.
                                 </div>
                               );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 md:w-1/3 relative">
                      <label className="text-xs font-black text-primary uppercase ml-1">Add Additional Test</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                          type="text"
                          value={testSearchQuery}
                          onChange={(e) => {
                            setTestSearchQuery(e.target.value);
                            setIsTestDropdownOpen(true);
                          }}
                          onFocus={() => setIsTestDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsTestDropdownOpen(false), 150)}
                          className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-bold text-primary"
                          placeholder="Search and add tests..."
                        />
                        
                        {isTestDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto top-full left-0">
                            {(() => {
                               const filteredList = getPathologyTests().filter(t => 
                                 !newReport.testSelection.includes(t.name) && 
                                 (!t.isHeader) && 
                                 (!getPathologyTests().some(g => g.includedTests?.includes(t.name)))
                               );
                               const availableTests = searchPathologyTests(testSearchQuery, filteredList);
                               return availableTests.length > 0 ? (
                                 availableTests.map(test => (
                                   <button
                                     key={test.id}
                                     type="button"
                                     onMouseDown={(e) => { 
                                       e.preventDefault(); 
                                       let testsToAdd = [test.name];
                                       if (test.isGroup && test.includedTests) {
                                         testsToAdd = [test.name, ...test.includedTests];
                                       }
                                       const newAdditions = testsToAdd.filter(t => !newReport.testSelection.includes(t));
                                       if (newAdditions.length > 0) {
                                         setNewReport({
                                           ...newReport,
                                           testSelection: [...newReport.testSelection, ...newAdditions]
                                         });
                                       }
                                       setTestSearchQuery('');
                                       setIsTestDropdownOpen(false);
                                     }}
                                     className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
                                   >
                                     {test.name}
                                   </button>
                                 ))
                               ) : (
                                 <div className="px-4 py-3 text-sm text-on-surface-variant text-center border-b border-outline-variant/5 last:border-0">
                                   No tests found.
                                 </div>
                               );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                      <h4 className="text-sm font-bold text-primary">Test Results Data</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {newReport.testSelection.length === 0 && (
                        <div className="p-4 text-center text-sm text-on-surface-variant bg-surface-container-low rounded-xl">
                          No tests selected. Please select a patient or add tests above.
                        </div>
                      )}
                      
                      {newReport.testSelection.map((testName) => {
                        const testInfo = findTestInfo(testName);
                        // If it's a Group or Header, just show it distinctively without input
                        if (testInfo?.isGroup || testInfo?.isHeader) {
                           return (
                             <div key={testName} className={`flex justify-between items-center p-3 mt-4 rounded-lg border-l-4 ${testInfo.isGroup ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-outline-variant/50'}`}>
                               <h4 className="font-bold text-primary text-sm uppercase tracking-wider">{testName}</h4>
                               <button 
                                  type="button" 
                                  onClick={() => {
                                    let toRemove = [testName];
                                    if (testInfo.isGroup && testInfo.includedTests) {
                                      toRemove = [...toRemove, ...testInfo.includedTests];
                                    }
                                    setNewReport({
                                      ...newReport,
                                      testSelection: newReport.testSelection.filter(t => !toRemove.includes(t))
                                    });
                                  }}
                                  className="p-1 text-primary opacity-50 hover:bg-primary hover:text-white rounded transition-all"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             </div>
                           );
                        }

                        // Try to get patient to determine reference range
                        const patient = patients.find(p => p.id === newReport.patientId);
                        const rangeLabel = testInfo ? getReferenceRangeLabel(testInfo.ranges, patient ? parseInt(patient.age) : undefined, patient?.gender) : '';
                        const refValues = testInfo ? getReferenceRangeValues(testInfo.ranges, patient ? parseInt(patient.age) : undefined, patient?.gender) : null;
                        const enteredValue = newReport.results[testName] || '';
                        
                        let valueStatus: 'normal' | 'low' | 'high' | null = null;
                        if (enteredValue && refValues && !isNaN(Number(enteredValue))) {
                          const numVal = Number(enteredValue);
                          if (refValues.min !== undefined && numVal < refValues.min) {
                            valueStatus = 'low';
                          } else if (refValues.max !== undefined && numVal > refValues.max) {
                            valueStatus = 'high';
                          } else {
                            valueStatus = 'normal';
                          }
                        }
                        
                        return (
                          <div key={testName} className="flex flex-col gap-2 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 relative group">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center flex-wrap gap-2">
                                  <label className="text-sm font-bold text-primary">{testName}</label>
                                  {valueStatus && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      valueStatus === 'high' 
                                        ? 'bg-error-container/20 text-error border border-error/10' 
                                        : valueStatus === 'low'
                                        ? 'bg-yellow-100/30 text-amber-600 border border-amber-500/10'
                                        : 'bg-green-100/30 text-green-600 border border-green-500/10'
                                    }`}>
                                      {valueStatus === 'high' ? '▲ High' : valueStatus === 'low' ? '▼ Low' : '✓ Normal'}
                                    </span>
                                  )}
                                </div>
                                {testInfo && (
                                  <div className="text-xs text-on-surface-variant mt-0.5">
                                    <span className="font-medium">Ref:</span> {rangeLabel} {testInfo.unit}
                                    {patient && testInfo.ranges && (testInfo.ranges.child || testInfo.ranges.male || testInfo.ranges.female) && (
                                      <span className="ml-1 text-[10px] bg-secondary-container/10 text-secondary px-1 rounded font-medium">
                                        (Adjusted for {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : patient.gender} • {patient.age} Yrs)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setNewReport({
                                  ...newReport, 
                                  testSelection: newReport.testSelection.filter(t => t !== testName) 
                                })} 
                                className="p-1.5 text-error opacity-50 hover:bg-error-container hover:opacity-100 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1 w-full min-w-0">
                              {testInfo?.options ? (
                                <select
                                  value={newReport.results[testName] || ''}
                                  onChange={(e) => {
                                    const nextResults = recalculateCBC(newReport.results, testName, e.target.value);
                                    setNewReport({
                                      ...newReport,
                                      results: nextResults
                                    });
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  className="test-result-input flex-1 min-w-0 px-4 py-2.5 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary-container outline-none transition-all font-bold text-primary"
                                >
                                  <option value="" disabled>Select result...</option>
                                  {testInfo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  inputMode={isNumericTest(testInfo) ? "decimal" : undefined}
                                  value={newReport.results[testName] || ''}
                                  onChange={(e) => {
                                    const nextResults = recalculateCBC(newReport.results, testName, e.target.value);
                                    setNewReport({
                                      ...newReport,
                                      results: nextResults
                                    });
                                  }}
                                  onKeyDown={handleInputKeyDown}
                                  className="test-result-input flex-1 min-w-0 px-4 py-2.5 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary-container outline-none transition-all font-bold text-primary"
                                  placeholder={`Enter result...`}
                                />
                              )}
                              {testInfo?.unit && (
                                <span className="text-xs font-bold text-on-surface-variant w-16 px-1 text-right shrink-0 truncate select-none animate-fade-in" title={testInfo.unit}>
                                  {testInfo.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-secondary-container/20 rounded-2xl flex gap-4 items-start">
                  <ShieldCheck className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-on-secondary-container mb-1">Security Enabled</h5>
                    <p className="text-[10px] text-on-secondary-container opacity-80 leading-relaxed">
                      Saving this report will log this dataset linked to this patient. Reports cannot be modified after finalization.
                    </p>
                  </div>
                </div>
              </form>

              <div className="p-4 sm:p-6 border-t border-outline-variant/10 bg-surface-container-low flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewReport({ patientId: '', testSelection: [], results: {} });
                    setPatientSearchQuery('');
                    setTestSearchQuery('');
                    setModalError(null);
                  }}
                  className="w-full sm:flex-1 py-3 bg-white border border-outline-variant/30 text-primary font-bold rounded-xl hover:bg-surface-container transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-report-form"
                  disabled={loading || !newReport.patientId}
                  className="w-full sm:flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="truncate">Finalize & Sign Report</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-primary/20 backdrop-blur-sm shadow-2xl"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-primary">Report Details: {selectedReport.patientName}</h3>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-surface-container rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black text-primary uppercase mb-2">Test Info</h4>
                  <p className="text-on-surface">{(selectedReport.testSelection || []).join(', ') || selectedReport.testType}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-black text-primary uppercase mb-2">Results</h4>
                  <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 space-y-3">
                    {(selectedReport.testSelection || []).map((testName: string) => {
                      const testInfo = findTestInfo(testName);
                      if (testInfo?.isGroup || testInfo?.isHeader) return null;
                      
                      const value = selectedReport.resultData?.[testName] || '';
                      
                      return (
                      <div key={testName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0">
                        <span className="text-sm font-medium text-on-surface-variant flex-1">{testName}</span>
                        {(() => {
                           if (testInfo?.options) {
                             return (
                               <select
                                 value={String(value)}
                                 onChange={(e) => {
                                   const nextResults = recalculateCBC(selectedReport.resultData || {}, testName, e.target.value);
                                   setSelectedReport({
                                     ...selectedReport,
                                     resultData: nextResults
                                   });
                                 }}
                                 onKeyDown={handleInputKeyDown}
                                 className="test-result-input w-full sm:w-1/2 px-3 py-2 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary-container outline-none transition-all text-sm font-bold text-primary"
                               >
                                 <option value="" disabled>Select result...</option>
                                 {testInfo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                             );
                           }
                           return (
                             <input
                               type="text"
                               inputMode={isNumericTest(testInfo) ? "decimal" : undefined}
                               value={String(value)}
                               onChange={(e) => {
                                 const nextResults = recalculateCBC(selectedReport.resultData || {}, testName, e.target.value);
                                 setSelectedReport({
                                   ...selectedReport,
                                   resultData: nextResults
                                 });
                               }}
                               onKeyDown={handleInputKeyDown}
                               className="test-result-input w-full sm:w-1/2 px-3 py-2 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary-container outline-none transition-all text-sm font-bold text-primary"
                             />
                           );
                        })()}
                      </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveResults}
                      disabled={savingResults}
                      className="px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      {savingResults ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Results'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-primary uppercase mb-2">Private Notes (Staff Only)</h4>
                  <textarea
                    value={selectedReport.privateNotes || ''}
                    onChange={(e) => setSelectedReport({...selectedReport, privateNotes: e.target.value})}
                    placeholder="Add private staff notes here..."
                    className="w-full text-sm px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all min-h-[120px] resize-y"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="px-4 py-2 bg-primary-container text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportToDelete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm"
            onClick={() => setReportToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-primary mb-2">Delete Report</h3>
              <p className="text-on-surface-variant mb-6">Are you sure you want to delete the report for {reportToDelete.patientName}? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                 <button
                  onClick={async () => {
                    try {
                      const patientId = reportToDelete.patientId;
                      const reportId = reportToDelete.id;

                      // 1. Delete the report document
                      await deleteDoc(doc(db, 'reports', reportId));

                      // 2. Delete the associated patient document if it exists
                      if (patientId) {
                        await deleteDoc(doc(db, 'patients', patientId));
                      }

                      // 3. Delete any associated invoices if they exist
                      if (patientId) {
                        const qInvoices = query(
                          collection(db, 'invoices'),
                          where('patientId', '==', patientId)
                        );
                        const querySnapshot = await getDocs(qInvoices);
                        const deletePromises = querySnapshot.docs.map(docSnap => 
                          deleteDoc(doc(db, 'invoices', docSnap.id))
                        );
                        await Promise.all(deletePromises);
                      }

                      setReportToDelete(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, 'reports');
                    }
                  }}
                  className="flex-1 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
