import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import CryptoJS from 'crypto-js';
import BackButton from '../components/BackButton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { ShieldCheck, ShieldAlert, CheckCircle2, FileText, User, Calendar, Loader2, Hospital } from 'lucide-react';
import { cn } from '../lib/utils';
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

export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const sig = searchParams.get('sig');
  
  const [status, setStatus] = useState<'loading' | 'verified' | 'tampered' | 'not-found'>('loading');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    async function verify() {
      if (!id) {
        setStatus('not-found');
        return;
      }

      try {
        const path = 'reports';
        let reportDoc;
        try {
          reportDoc = await getDoc(doc(db, path, id));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `${path}/${id}`);
          return;
        }

        if (!reportDoc.exists()) {
          setStatus('not-found');
          return;
        }

        const data = reportDoc.data();
        
        const reportDataPayload = data.testType ? {
          patientId: data.patientId,
          testType: data.testType,
          results: data.resultData,
          timestamp: data.createdAt
        } : {
          patientId: data.patientId,
          testSelection: data.testSelection,
          results: data.resultData,
          timestamp: data.createdAt
        };

        // Call backend to verify signature
        const signatureToVerify = sig || data.signature || '';
        let isVerified = false;
        try {
          const response = await fetch('/api/reports/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              reportData: reportDataPayload, 
              signature: signatureToVerify 
            }),
          });
          if (response.ok) {
            isVerified = true;
          }
        } catch (verifyError) {
          console.warn("Backend verification endpoint unavailable. Using client-side signature check fallback:", verifyError);
        }

        // Verification fallback logic
        if (!isVerified) {
          const expectedSig1 = generateClientSignature(reportDataPayload);
          const expectedSig2 = CryptoJS.HmacSHA256(JSON.stringify(reportDataPayload), (import.meta as any).env.VITE_REPORT_SECRET_KEY || "default_secret_key_change_me").toString(CryptoJS.enc.Hex);
          if (signatureToVerify === expectedSig1 || signatureToVerify === expectedSig2) {
            isVerified = true;
          }
        }

        if (isVerified) {
          setReportData(data);
          setStatus('verified');
        } else {
          setStatus('tampered');
        }
      } catch (err) {
        console.error(err);
        setStatus('tampered');
      }
    }

    verify();
  }, [id, sig]);

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6 relative">
      <BackButton />
      <div className="max-w-2xl w-full pt-16 md:pt-0">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-outline-variant/30 mb-6">
            <Hospital className="w-5 h-5 text-primary-container" />
            <span className="text-sm font-black text-primary tracking-tight">HEALTH CARE DIAGNOSTICS CENTER</span>
          </div>
          <h1 className="text-3xl font-black text-primary">Diagnostic Report Authenticity</h1>
          <p className="text-on-surface-variant mt-2">Verified via secure hash</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-4 transition-all duration-700",
            status === 'verified' && "border-secondary/20 shadow-secondary/10",
            status === 'tampered' && "border-error/20 shadow-error/10",
            status === 'not-found' && "border-outline",
            status === 'loading' && "border-surface-container"
          )}
        >
          {status === 'loading' && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary-container animate-spin" />
              <p className="font-bold text-primary animate-pulse">Running Security Check...</p>
            </div>
          )}

          {status === 'verified' && (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-6 animate-bounce">
                  <ShieldCheck size={64} />
                </div>
                <h2 className="text-4xl font-black text-secondary uppercase tracking-tighter">Verified Authentic</h2>
                <p className="text-on-surface-variant font-medium mt-2">This report matches the original lab record exactly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-surface-container-low rounded-4xl border border-outline-variant/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary-container" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant">Patient Name</span>
                      <span className="font-bold text-primary">{reportData?.patientName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary-container" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant">Date Issued</span>
                      <span className="font-bold text-primary">{new Date(reportData?.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-container" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant">Test Type</span>
                      <span className="font-bold text-primary">{reportData?.testType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant">Digital Signature</span>
                      <span className="text-[10px] font-mono text-secondary truncate w-32">{reportData?.signature}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-outline-variant/10">
                <h4 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest text-center">Diagnostic Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(reportData?.resultData || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-surface-container rounded-xl">
                      <span className="text-xs font-bold text-on-surface-variant">{key}</span>
                      <span className="text-xs font-black text-primary">{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status === 'tampered' && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center text-error mb-6">
                <ShieldAlert size={64} />
              </div>
              <h2 className="text-4xl font-black text-error uppercase tracking-tighter">Security Alert</h2>
              <p className="text-primary font-bold mt-4">This report has been tampered with or contains invalid credentials.</p>
              <p className="text-on-surface-variant text-sm mt-2 max-w-sm">The data provided does not match the data in our secure records. Please contact the diagnostic center immediately.</p>
              <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-error text-white font-bold rounded-2xl shadow-xl hover:opacity-90">Retry Check</button>
            </div>
          )}

          {status === 'not-found' && (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-bold text-primary">Report Not Found</h2>
              <p className="text-on-surface-variant mt-2">The requested report ID does not exist in our database.</p>
            </div>
          )}
        </motion.div>

        <p className="mt-8 text-center text-[10px] text-on-surface-variant uppercase font-bold tracking-widest leading-relaxed">
          This verification service is for informational purposes only. <br />
          Always consult a medical professional for clinical diagnosis.
        </p>
      </div>
    </div>
  );
}
