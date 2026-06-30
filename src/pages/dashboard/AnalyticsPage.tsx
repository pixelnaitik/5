import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Users, Microscope, Activity, TestTube, FileText, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { cn } from '../../lib/utils';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#cbd5e1'];
const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#94a3b8']; // Matches image approximate colors

export default function AnalyticsPage() {
  const [fromDate, setFromDate] = useState(() => {
    // default to 7 days ago
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, 'reports'), (s) => {
      setReports(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'reports'));

    const unsubPatients = onSnapshot(collection(db, 'patients'), (s) => {
      setPatients(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'patients'));

    return () => {
      unsubReports();
      unsubPatients();
    };
  }, []);

  const activeReportDates = useMemo(() => {
    return new Set(
      reports.map(r => r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '')
    );
  }, [reports]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays, year, month };
  };

  const { filteredReports, filteredPatients } = useMemo(() => {
    const fr = reports.filter(r => {
      if (!r.createdAt) return false;
      const createdAtStr = new Date(r.createdAt).toISOString().split('T')[0];
      if (fromDate && createdAtStr < fromDate) return false;
      if (toDate && createdAtStr > toDate) return false;
      return true;
    });

    // Patient filter logic based on registration time if available, otherwise just use all for the "Unique Patients" stat
    const fp = patients.filter(p => {
       if(!p.createdAt) return false;
       const createdAtStr = new Date(p.createdAt).toISOString().split('T')[0];
       if (fromDate && createdAtStr < fromDate) return false;
       if (toDate && createdAtStr > toDate) return false;
       return true;
    });

    return { filteredReports: fr, filteredPatients: fp };
  }, [reports, patients, fromDate, toDate]);

  const trendData = useMemo(() => {
    const daily: Record<string, { tests: number, reports: number }> = {};
    
    // Generate dates between fromDate and toDate
    const arr: string[] = [];
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const limit = new Date(start);
      // Let's cap at max 90 days to prevent chart layout explosions if range is huge
      let count = 0;
      while (limit <= end && count < 90) {
        const dateStr = limit.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        daily[dateStr] = { tests: 0, reports: 0 };
        arr.push(dateStr);
        limit.setDate(limit.getDate() + 1);
        count++;
      }
    } else {
      // Default to last 7 days if not set
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        daily[dateStr] = { tests: 0, reports: 0 };
        arr.push(dateStr);
      }
    }

    filteredReports.forEach(r => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      if (daily[dateStr]) {
          daily[dateStr].reports += 1;
          const testsCount = typeof r.results === 'object' ? Object.keys(r.results).length : r.tests?.length;
          daily[dateStr].tests += testsCount || 1;
      }
    });

    return arr.map(dateStr => ({
        name: dateStr,
        ...daily[dateStr]
    }));
  }, [filteredReports, fromDate, toDate]);

  const testVolumeData = useMemo(() => {
    const types: Record<string, number> = {};
    filteredReports.forEach(r => {
      const type = r.testType || 'Other';
      types[type] = (types[type] || 0) + 1;
    });

    if (Object.keys(types).length === 0) return [];

    return Object.keys(types)
      .map(k => ({ name: k, value: types[k] }))
      .sort((a,b) => b.value - a.value);
  }, [filteredReports]);

  const patientInsightsData = useMemo(() => {
     let newP = 0;
     let recurringP = 0;
     const counts: Record<string, number> = {};
     reports.forEach(r => {
       if(r.patientId) {
          counts[r.patientId] = (counts[r.patientId] || 0) + 1;
       }
     });
     
     Object.values(counts).forEach(c => {
        if(c > 1) recurringP++;
        else newP++;
     });

     if(newP === 0 && recurringP === 0) return [{ name: 'No Data', value: 1 }];

     return [
        { name: 'New Patients', value: newP },
        { name: 'Recurring Patients', value: recurringP }
     ];
  }, [reports]);

  const topDoctors = useMemo(() => {
    const stats: Record<string, { patients: Set<string>, reports: number }> = {};
    reports.forEach(r => {
        const docName = r.doctorName || r.doctorId || 'Unknown Doctor';
        if (!stats[docName]) stats[docName] = { patients: new Set(), reports: 0 };
        stats[docName].reports += 1;
        if(r.patientId) stats[docName].patients.add(r.patientId);
    });

    return Object.keys(stats).map(k => ({
        name: k,
        patients: stats[k].patients.size,
        reports: stats[k].reports
    })).sort((a,b) => b.reports - a.reports).slice(0, 5);
  }, [reports]);

  const totalReports = trendData.reduce((acc, curr) => acc + curr.reports, 0);
  const totalTests = trendData.reduce((acc, curr) => acc + curr.tests, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-outline-variant/20">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Dashboard</h2>
          <p className="text-sm text-on-surface-variant">Overview of your lab performance</p>
        </div>
        
        <div className="relative w-full sm:w-64 z-30">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all text-on-surface text-left font-semibold hover:bg-surface-container-low shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
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
                className="w-3.5 h-3.5 text-on-surface-variant hover:text-error shrink-0 cursor-pointer" 
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
                  className="absolute right-0 mt-2 p-4 bg-white border border-outline-variant/30 shadow-xl rounded-2xl w-80 z-50 origin-top-right whitespace-normal"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: totalReports.toLocaleString(), trend: '+18.6% vs Last 7 days', trendUp: true, icon: FileText, colorClass: 'bg-indigo-500', textClass: 'text-indigo-500' },
          { label: 'Total Tests', value: totalTests.toLocaleString(), trend: '+15.2% vs Last 7 days', trendUp: true, icon: TestTube, colorClass: 'bg-blue-500', textClass: 'text-blue-500' },
          { label: 'Unique Patients', value: patients.length.toLocaleString(), trend: '+12.8% vs Last 7 days', trendUp: true, icon: Users, colorClass: 'bg-emerald-500', textClass: 'text-emerald-500' },
          { label: 'Avg Tests/Patient', value: (totalReports > 0 ? (totalTests / patients.length).toFixed(1) : '0'), trend: '+8.3% vs Last 7 days', trendUp: true, icon: Activity, colorClass: 'bg-orange-500', textClass: 'text-orange-500' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label} 
            className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-on-surface-variant">{kpi.label}</p>
                <h4 className="text-2xl font-black text-primary tracking-tight">{kpi.value}</h4>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${kpi.colorClass} shadow-md`}>
                 <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
               <span className={`text-[11px] font-bold ${kpi.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>↑ {kpi.trend.split(' ')[0]}</span>
               <span className="text-[11px] text-on-surface-variant">{kpi.trend.substring(kpi.trend.indexOf(' '))}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Report Volume Trend */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
           className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[360px]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-primary">Report Volume Trend</h3>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="reports" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Test Volume Trend */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
           className="bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[360px]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-primary">Test Volume Trend</h3>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="tests" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Splits & Tops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="lg:col-span-1 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[320px]"
        >
          <h3 className="text-sm font-bold text-primary mb-2">Test Category Distribution</h3>
          <div className="flex-1 w-full relative flex items-center justify-center">
             {testVolumeData.length === 0 ? (
                 <p className="text-sm text-on-surface-variant">No data available</p>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={testVolumeData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" >
                       {testVolumeData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                     <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                   </PieChart>
                 </ResponsiveContainer>
             )}
             {testVolumeData.length > 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[100px]">
                     <span className="text-sm font-bold text-primary truncate max-w-[100px] text-center" title={testVolumeData[0].name}>{testVolumeData[0].name}</span>
                     <span className="text-[10px] text-on-surface-variant">Most Reported</span>
                 </div>
             )}
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="lg:col-span-2 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[320px]"
        >
          <h3 className="text-sm font-bold text-primary mb-4">Top Tests by Volume</h3>
          <div className="flex-1 w-full min-h-0">
             {testVolumeData.length === 0 ? (
                 <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-on-surface-variant">No data available</p>
                 </div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testVolumeData.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e3e6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             )}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Patient Insights & Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
           className="lg:col-span-1 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[300px]"
        >
          <h3 className="text-sm font-bold text-primary mb-2">Patient Insights</h3>
          <span className="text-xs text-on-surface-variant block mb-4">New vs Recurring Patients</span>
          <div className="flex-1 w-full relative flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={patientInsightsData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" >
                   <Cell fill="#10b981" />
                   <Cell fill="#3b82f6" />
                   <Cell fill="#cbd5e1" />
                 </Pie>
                 <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                 <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[100px]">
                 <span className="text-lg font-bold text-primary">{patients.length}</span>
                 <span className="text-[9px] text-on-surface-variant">Total Patients</span>
             </div>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
           className="lg:col-span-2 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col h-[300px] overflow-hidden"
        >
          <h3 className="text-sm font-bold text-primary mb-4">Top Referring Doctors</h3>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-outline-variant/20">
                      <th className="pb-3 text-xs font-semibold text-on-surface-variant w-1/2 text-left">Doctor</th>
                      <th className="pb-3 text-xs font-semibold text-on-surface-variant text-right">Patients</th>
                      <th className="pb-3 text-xs font-semibold text-on-surface-variant text-right">Reports Generated</th>
                   </tr>
                </thead>
                <tbody>
                   {topDoctors.length === 0 ? (
                       <tr><td colSpan={3} className="py-8 text-center text-sm text-on-surface-variant">No data available</td></tr>
                   ) : topDoctors.map((doc, idx) => (
                       <tr key={idx} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50">
                          <td className="py-3 text-sm font-medium text-primary text-left">{doc.name}</td>
                          <td className="py-3 text-sm text-on-surface-variant text-right">{doc.patients}</td>
                          <td className="py-3 text-sm font-medium text-primary text-right">{doc.reports}</td>
                       </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
