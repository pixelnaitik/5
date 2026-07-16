import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, limit, orderBy, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function OverviewPage({ 
  setActiveTab, 
  onAddPatient, 
  onManageReport,
  onCreateReportForPatient
}: { 
  setActiveTab?: (tab: string) => void;
  onAddPatient?: () => void;
  onManageReport?: (reportId: string) => void;
  onCreateReportForPatient?: (patientId: string) => void;
}) {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    patients: 0,
    reports: 0,
    revenue: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const [reportToDelete, setReportToDelete] = useState<any | null>(null);

  useEffect(() => {
    // Basic counter for demo (we could use count() in production firestore)
    const unsubPatients = onSnapshot(collection(db, 'patients'), (s) => setStats(prev => ({ ...prev, patients: s.size })), (error) => {
      handleFirestoreError(error, OperationType.GET, 'patients');
    });
    
    const unsubReports = onSnapshot(collection(db, 'reports'), (s) => {
      setStats(prev => ({ ...prev, reports: s.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });
    
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => {
      const rev = s.docs.reduce((acc, doc) => acc + (doc.data().status === 'paid' ? doc.data().amount : 0), 0);
      setStats(prev => ({ ...prev, revenue: rev }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'invoices');
    });

    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(10));
    const unsubRecentReports = onSnapshot(qReports, (s) => setRecentReports(s.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    const qPatients = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(10));
    const unsubRecentPatients = onSnapshot(qPatients, (s) => setRecentPatients(s.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => {
      handleFirestoreError(error, OperationType.GET, 'patients');
    });

    return () => {
      unsubPatients();
      unsubReports();
      unsubInvoices();
      unsubRecentReports();
      unsubRecentPatients();
    };
  }, []);

  const combinedReports = React.useMemo(() => {
    const list = [
      ...recentReports.map(r => ({ ...r, itemType: 'report', timestamp: r.createdAt })),
      ...recentPatients
        .filter(p => !recentReports.some(r => r.patientId === p.id))
        .map(p => ({ ...p, itemType: 'patient', timestamp: p.createdAt }))
    ];
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [recentReports, recentPatients]);

  const cards = [
    { label: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-primary-container', trend: '+12.5%' },
    { label: 'Reports Finalized', value: stats.reports, icon: FileText, color: 'bg-secondary', trend: '+8.2%' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, idx) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm relative overflow-hidden group"
          >
            <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-5 transition-all group-hover:scale-150", card.color)} />
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{card.label}</span>
                <h4 className="text-2xl font-black text-primary">{card.value}</h4>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <ArrowUpRight className="w-3 h-3 text-secondary" />
              <span className="text-xs font-bold text-secondary">{card.trend}</span>
              <span className="text-[10px] text-on-surface-variant ml-auto">vs last week</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patients Registry */}
        <div className="bg-white p-8 rounded-4xl border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-container" />
                  Patients Registry
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">Recently registered patients</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onAddPatient && onAddPatient()}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Patient
                </button>
                <button 
                  onClick={() => setActiveTab && setActiveTab('patients')}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary transition-all border border-outline-variant/20 cursor-pointer"
                >
                  Manage Patients
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 text-[10px] font-black uppercase text-on-surface-variant tracking-wider">
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 px-4">Details</th>
                    <th className="pb-3 px-4">Date</th>
                    {role !== 'guest' && <th className="pb-3 pl-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentPatients.map((patient, idx) => (
                    <motion.tr 
                      key={patient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setActiveTab && setActiveTab('patients')}
                      className="hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-xs">
                            {patient.name ? patient.name[0].toUpperCase() : '?'}
                          </div>
                          <span className="font-bold text-sm text-primary line-clamp-1">{patient.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-surface-container-high text-primary rounded text-[10px] font-bold">{patient.age}y</span>
                          <span className="capitalize text-[10px] text-on-surface-variant font-semibold">{patient.gender}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[10px] font-bold text-on-surface-variant">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      {role !== 'guest' && (
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPatientToDelete(patient);
                            }}
                            className="p-1.5 text-error hover:bg-error-container/20 rounded-lg transition-all cursor-pointer"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                  {recentPatients.length === 0 && (
                    <tr>
                      <td colSpan={role !== 'guest' ? 4 : 3} className="py-8 text-center text-xs text-on-surface-variant font-medium">
                        No recent patients registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reports Registry */}
        <div className="bg-white p-8 rounded-4xl border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Reports Desk
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">Recently created diagnostic reports</p>
              </div>
              <button 
                onClick={() => setActiveTab && setActiveTab('reports')}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary transition-all border border-outline-variant/20 cursor-pointer"
              >
                Manage Reports
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 text-[10px] font-black uppercase text-on-surface-variant tracking-wider">
                    <th className="pb-3 pr-4">Patient & Test</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Sign</th>
                    <th className="pb-3 px-4">Date</th>
                    {role !== 'guest' && <th className="pb-3 pl-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {combinedReports.map((item, idx) => {
                    const isReport = item.itemType === 'report';
                    const name = isReport ? item.patientName : item.name;
                    const testSub = isReport 
                      ? (item.testType || 'General') 
                      : (item.testSelection?.length > 0 ? item.testSelection.join(', ') : 'No test selected');
                    const status = isReport ? (item.status || 'final') : 'pending';
                    const isSecured = isReport && !!item.signature;
                    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'N/A';

                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          if (isReport) {
                            onManageReport?.(item.id);
                          } else {
                            onCreateReportForPatient?.(item.id);
                          }
                        }}
                        className="hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-primary line-clamp-1">{name}</span>
                            <span className="text-[10px] text-on-surface-variant font-medium line-clamp-1">{testSub}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            status === 'finalized' || status === 'final'
                              ? "bg-green-50 text-green-700 border border-green-200/50" 
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
                            {isSecured ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-secondary">Secured</span>
                              </>
                            ) : (
                              <span className="text-gray-400">Unsigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[10px] font-bold text-on-surface-variant">
                          {date}
                        </td>
                        {role !== 'guest' && (
                          <td className="py-3.5 pl-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportToDelete(item);
                              }}
                              className="p-1.5 text-error hover:bg-error-container/20 rounded-lg transition-all cursor-pointer"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                  {combinedReports.length === 0 && (
                    <tr>
                      <td colSpan={role !== 'guest' ? 5 : 4} className="py-8 text-center text-xs text-on-surface-variant font-medium">
                        No recent reports found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Patient Confirmation Modal */}
      <AnimatePresence>
        {patientToDelete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm"
            onClick={() => setPatientToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-primary mb-2">Delete Patient</h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                Are you sure you want to delete patient **{patientToDelete.name}**? This will remove their record from the registry.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPatientToDelete(null)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteDoc(doc(db, 'patients', patientToDelete.id));
                      setPatientToDelete(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, 'patients');
                    }
                  }}
                  className="flex-1 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Report Confirmation Modal */}
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
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                Are you sure you want to delete the report/patient **{reportToDelete.patientName || reportToDelete.name}**? This will remove the report, patient record, and associated invoices.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const patientId = reportToDelete.patientId || reportToDelete.id;
                      const reportId = reportToDelete.itemType === 'report' ? reportToDelete.id : null;

                      // 1. Delete the report document if it exists
                      if (reportId) {
                        await deleteDoc(doc(db, 'reports', reportId));
                      }

                      // 2. Delete the patient document
                      if (patientId) {
                        await deleteDoc(doc(db, 'patients', patientId));
                      }

                      // 3. Delete any associated invoices
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
                  className="flex-1 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
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
