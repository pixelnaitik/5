import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Search, Plus, UserPlus, Phone, Calendar, Trash2, Edit2, X, Check, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

import { getPathologyTests, searchPathologyTests } from '../../lib/pathology-tests';
import { DEFAULT_DOCTORS } from '../../lib/doctors';

export default function PatientsPage() {
  const { role } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays, year, month };
  };

  const activePatientDates = useMemo(() => {
    return new Set(
      patients.map(p => p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '')
    );
  }, [patients]);
  
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    doctorName: '',
    address: '',
    testSelection: [] as string[],
  });

  useEffect(() => {
    const path = 'patients';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    const qDocs = query(collection(db, 'doctors'), orderBy('createdAt', 'desc'));
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubDocs();
    };
  }, []);

  const addNewDoctor = async (name: string) => {
    if (!name.trim()) return;
    setIsAddingDoctor(true);
    try {
      await addDoc(collection(db, 'doctors'), {
        name: name.trim(),
        createdAt: new Date().toISOString(),
      });
      setFormData(prev => ({ ...prev, doctorName: name.trim() }));
      setIsDoctorDropdownOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'doctors');
    } finally {
      setIsAddingDoctor(false);
    }
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Patient Full Name is required.');
      return;
    }
    if (!formData.age) {
      setFormError('Patient Age is required.');
      return;
    }

    const path = 'patients';
    try {
      if (editingPatient) {
        await updateDoc(doc(db, path, editingPatient.id), {
          ...formData,
          age: parseInt(formData.age),
        });
        
        // Synchronize with related reports
        try {
          const reportsRef = collection(db, 'reports');
          const q = query(reportsRef, where('patientId', '==', editingPatient.id));
          const querySnapshot = await getDocs(q);
          
          for (const reportDoc of querySnapshot.docs) {
            const currentReport = reportDoc.data();
            
            // Re-sign data on backend due to results/selection change
            const response = await fetch('/api/reports/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                reportData: {
                  patientId: editingPatient.id,
                  testSelection: formData.testSelection,
                  // Maintain existing result data where tests still exist
                  results: currentReport.resultData || {},
                  timestamp: currentReport.createdAt
                } 
              }),
            });
            const { signature } = await response.json();

            await updateDoc(doc(db, 'reports', reportDoc.id), {
              testSelection: formData.testSelection,
              signature: signature
            });
          }
        } catch (syncErr) {
          console.error("Failed to sync reports: ", syncErr);
        }

      } else {
        const d = new Date();
        const yy = d.getFullYear().toString().slice(-2);
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const chars = '0123456789';
        let randomPart = '';
        for (let i = 0; i < 3; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const patientId = `${yy}${mm}${randomPart}`;
        
        await setDoc(doc(db, path, patientId), {
          ...formData,
          age: parseInt(formData.age),
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError('Failed to save patient. Check Firestore permissions or connection.');
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (e) {
        // Logged
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', age: '', gender: 'male', phone: '', doctorName: '', address: '', testSelection: [] });
    setEditingPatient(null);
    setFormError('');
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.phone.includes(searchTerm);
    
    const matchesDate = (() => {
      if (!p.createdAt) return true;
      const itemDateStr = new Date(p.createdAt).toISOString().split('T')[0];
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      return true;
    })();
    
    return matchesSearch && matchesDate;
  });

  const filteredAvailableTests = (() => {
    const list = getPathologyTests().filter(t => 
      !formData.testSelection.includes(t.name) &&
      !t.isHeader &&
      !getPathologyTests().some(g => g.includedTests?.includes(t.name))
    );
    return searchPathologyTests(testSearchQuery, list);
  })();

  const addTest = (test: string) => {
    const testInfo = getPathologyTests().find(t => t.name === test);
    let testsToAdd = [test];
    if (testInfo?.isGroup && testInfo.includedTests) {
      testsToAdd = [test, ...testInfo.includedTests];
    }
    
    // Auto-add Direct and Indirect Bilirubin when Total Serum Bilirubin is selected
    if (test === 'Total Serum Bilirubin') {
      testsToAdd = ['Total Serum Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin'];
    }

    setFormData(prev => {
      const newAdditions = testsToAdd.filter(t => !prev.testSelection.includes(t));
      return {
        ...prev,
        testSelection: [...prev.testSelection, ...newAdditions]
      };
    });
    setTestSearchQuery('');
    setIsTestDropdownOpen(false);
  };

  const removeTest = (test: string) => {
    const testInfo = getPathologyTests().find(t => t.name === test);
    let toRemove = [test];
    if (testInfo?.isGroup && testInfo.includedTests) {
      toRemove = [...toRemove, ...testInfo.includedTests];
    }
    setFormData(prev => ({
      ...prev,
      testSelection: prev.testSelection.filter(t => !toRemove.includes(t))
    }));
  };

  const allDoctors = React.useMemo(() => {
    const uniqueDynamic = doctors.filter(d => !DEFAULT_DOCTORS.some(defaultName => defaultName.toLowerCase() === d.name.toLowerCase()));
    return [
      ...DEFAULT_DOCTORS.map(name => ({ id: `default_${name}`, name })),
      ...uniqueDynamic
    ];
  }, [doctors]);

  const filteredDoctorsDropdown = allDoctors.filter(d => 
    d.name.toLowerCase().includes(formData.doctorName.toLowerCase())
  );
  
  const showAddDoctorButton = formData.doctorName.trim().length > 0 && 
    !allDoctors.some(d => d.name.toLowerCase() === formData.doctorName.trim().toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
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
                <ChevronDown className={cn("w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200", isCalendarOpen && "rotate-180")} />
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
                    className="absolute right-0 mt-2 p-4 bg-white border border-outline-variant/30 shadow-xl rounded-3xl w-80 z-50 origin-top-right whitespace-normal"
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
                        <span key={day} className="text-[10px] font-bold text-on-surface-variant uppercase w-8 h-8 flex items-center justify-center select-none shadow-none">
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
                        const hasReports = activePatientDates.has(dIso);
                        
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
            <UserPlus className="w-5 h-5" />
            Register Patient
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Age / Gender</th>
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Phone</th>
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Registered</th>
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  className={cn("transition-all group", role !== 'guest' ? "hover:bg-surface-container-low/50 cursor-pointer" : "")}
                  onClick={() => {
                    if (role === 'guest') return;
                    setEditingPatient(patient);
                    setFormData({ 
                      name: patient.name || '', 
                      age: patient.age ? patient.age.toString() : '', 
                      gender: patient.gender || 'male', 
                      phone: patient.phone || '',
                      doctorName: patient.doctorName || '',
                      address: patient.address || '',
                      testSelection: patient.testSelection || []
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed-dim/20 flex items-center justify-center text-primary-container font-bold">
                        {patient.name[0]}
                      </div>
                      <span className="font-bold text-primary">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-surface-container rounded text-xs font-medium">{patient.age}y</span>
                      <span className="capitalize text-xs text-on-surface-variant font-medium">{patient.gender}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                    {patient.phone}
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">
                    {new Date(patient.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 transition-all">
                      {role !== 'guest' && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPatient(patient);
                              setFormData({ 
                                name: patient.name || '', 
                                age: patient.age ? patient.age.toString() : '', 
                                gender: patient.gender || 'male', 
                                phone: patient.phone || '',
                                doctorName: patient.doctorName || '',
                                address: patient.address || '',
                                testSelection: patient.testSelection || []
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-primary hover:bg-primary-fixed-dim/20 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              setPatientToDelete(patient);
                            }}
                            className="p-2 text-error hover:bg-error-container/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-on-surface-variant/40" />
            </div>
            <p className="text-on-surface-variant font-medium">No patients found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm"
            onClick={() => { setIsModalOpen(false); resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }} 
                    className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-primary">
                    {editingPatient ? 'Edit Patient' : 'Register New Patient'}
                  </h3>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-error-container text-error text-sm font-bold rounded-lg relative">
                    <span className="block pr-6">{formError}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-black text-primary uppercase ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all"
                    placeholder="Patient Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Age</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all"
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-primary uppercase ml-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all appearance-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-primary uppercase ml-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-xs font-black text-primary uppercase ml-1">Referred By (Doctor Name)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant z-10" />
                    <input
                      type="text"
                      value={formData.doctorName}
                      onChange={(e) => {
                        setFormData({...formData, doctorName: e.target.value});
                        setIsDoctorDropdownOpen(true);
                      }}
                      onFocus={() => setIsDoctorDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDoctorDropdownOpen(false), 200)}
                      className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all text-sm"
                      placeholder="Search or add doctor (e.g. Dr. Rahul Pande)"
                    />
                    
                    {isDoctorDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto top-full left-0">
                        {filteredDoctorsDropdown.length > 0 ? (
                          filteredDoctorsDropdown.map((docItem) => (
                            <button
                              key={docItem.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({...formData, doctorName: docItem.name});
                                setIsDoctorDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
                            >
                              {docItem.name}
                            </button>
                          ))
                        ) : (
                          !showAddDoctorButton && (
                            <div className="px-4 py-3 text-sm text-on-surface-variant text-center border-b border-outline-variant/5 last:border-0">
                              No matching doctors found.
                            </div>
                          )
                        )}
                        
                        {showAddDoctorButton && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addNewDoctor(formData.doctorName);
                            }}
                            disabled={isAddingDoctor}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            {isAddingDoctor ? 'Adding...' : `Add "${formData.doctorName}" as new doctor`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-primary uppercase ml-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all resize-none min-h-[60px]"
                    placeholder="Patient Address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-primary uppercase ml-1">Test Selection</label>
                  
                  {formData.testSelection.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.testSelection.map(test => (
                        <span key={test} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-white text-xs font-bold rounded-lg shadow-sm">
                          {test}
                          <button type="button" onClick={() => removeTest(test)} className="hover:text-error transition-colors p-0.5 border border-transparent rounded-full hover:border-error hover:bg-white/10">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

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
                      className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all text-sm"
                      placeholder="Search and add tests..."
                    />
                    
                    {isTestDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto top-full left-0">
                        {filteredAvailableTests.length > 0 ? (
                          filteredAvailableTests.map(test => (
                            <button
                              key={test.id}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); addTest(test.name); }}
                              className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
                            >
                              {test.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-on-surface-variant text-center border-b border-outline-variant/5 last:border-0">
                            No unselected tests found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="flex-1 py-3 bg-surface-container text-primary font-bold rounded-xl hover:bg-surface-variant transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {editingPatient ? 'Save Changes' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <p className="text-on-surface-variant mb-6">Are you sure you want to delete {patientToDelete.name}? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPatientToDelete(null)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const path = 'patients';
                    try {
                      await deleteDoc(doc(db, path, patientToDelete.id));
                      setPatientToDelete(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, path);
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
