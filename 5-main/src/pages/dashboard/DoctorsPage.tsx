import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Search, Plus, Trash2, Edit2, X, Check, ArrowLeft, Microscope, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { DEFAULT_DOCTORS } from '../../lib/doctors';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function DoctorsPage() {
  const { role } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays, year, month };
  };

  const activeDoctorDates = useMemo(() => {
    return new Set(
      doctors.map(d => d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '')
    );
  }, [doctors]);

  useEffect(() => {
    const path = 'doctors';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const qPatients = query(collection(db, 'patients'));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribePatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'doctors';
    try {
      if (editingDoctor) {
        await updateDoc(doc(db, path, editingDoctor.id), {
          ...formData,
        });
      } else {
        await addDoc(collection(db, path), {
          ...formData,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '' });
    setEditingDoctor(null);
  };

  const allDoctors = useMemo(() => {
    const uniqueDynamic = doctors.filter(d => !DEFAULT_DOCTORS.some(defaultName => defaultName.toLowerCase() === d.name.toLowerCase()));
    return [
      ...DEFAULT_DOCTORS.map(name => ({
        id: `default_${name}`,
        name,
        phone: '',
        createdAt: new Date().toISOString(),
        isDefault: true
      })),
      ...uniqueDynamic
    ];
  }, [doctors]);

  const filteredDoctors = allDoctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.phone && d.phone.includes(searchTerm));
    
    const matchesDate = (() => {
      if (!d.createdAt) return true;
      const itemDateStr = new Date(d.createdAt).toISOString().split('T')[0];
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      return true;
    })();
    
    return matchesSearch && matchesDate;
  });

  const getDoctorStats = (doctorName: string) => {
    // Find all patients referred by this doctor
    const referrals = patients.filter(p => dnameMatches(p.doctorName, doctorName));
    const patientsCount = referrals.length;
    // Count total tests across those patients
    const testsCount = referrals.reduce((sum, p) => sum + (p.testSelection ? p.testSelection.length : 0), 0);
    return { patientsCount, testsCount };
  };

  const dnameMatches = (n1?: string, n2?: string) => {
    if (!n1 || !n2) return false;
    return n1.trim().toLowerCase() === n2.trim().toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search doctors..."
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
                        const hasReports = activeDoctorDates.has(dIso);
                        
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
            <Plus className="w-5 h-5" />
            Add Doctor
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Doctor Name</th>
                <th className="px-6 py-4 text-xs font-black text-primary uppercase tracking-widest">Patients Referred</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredDoctors.map((docItem) => {
                const stats = getDoctorStats(docItem.name);
                return (
                  <tr key={docItem.id} className="hover:bg-surface-container-low/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
                          <Microscope className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <span className="font-bold text-primary block">{docItem.name}</span>
                          <span className="text-xs text-on-surface-variant">{docItem.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {stats.patientsCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredDoctors.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-8 h-8 text-on-surface-variant/40" />
            </div>
            <p className="text-on-surface-variant font-medium">No doctors found</p>
          </div>
        )}
      </div>

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
                    {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                  </h3>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-black text-primary uppercase ml-1">Doctor Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all"
                    placeholder="Dr. Rahul Pande"
                  />
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
                    {editingDoctor ? 'Save Changes' : 'Add Doctor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {doctorToDelete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm"
            onClick={() => setDoctorToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-primary mb-2">Delete Doctor</h3>
              <p className="text-on-surface-variant mb-6">Are you sure you want to delete {doctorToDelete.name}? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDoctorToDelete(null)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const path = 'doctors';
                    try {
                      await deleteDoc(doc(db, path, doctorToDelete.id));
                      setDoctorToDelete(null);
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
