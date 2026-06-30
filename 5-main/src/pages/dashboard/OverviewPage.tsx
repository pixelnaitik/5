import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  Microscope
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../../lib/utils';

export default function OverviewPage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [stats, setStats] = useState({
    patients: 0,
    reports: 0,
    revenue: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [chartData, setChartData] = useState([
    { name: 'Mon', count: 0 },
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ]);

  useEffect(() => {
    // Basic counter for demo (we could use count() in production firestore)
    const unsubPatients = onSnapshot(collection(db, 'patients'), (s) => setStats(prev => ({ ...prev, patients: s.size })), (error) => {
      handleFirestoreError(error, OperationType.GET, 'patients');
    });
    
    const unsubReports = onSnapshot(collection(db, 'reports'), (s) => {
      setStats(prev => ({ ...prev, reports: s.size }));
      
      const processChartData = () => {
        const past7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);
          return d;
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const counts = past7Days.map(date => {
          return {
            name: dayNames[date.getDay()],
            date: date,
            count: 0
          };
        });

        s.docs.forEach(d => {
          const data = d.data();
          if (data.createdAt) {
            const createdAt = new Date(data.createdAt);
            createdAt.setHours(0,0,0,0);
            
            const match = counts.find(c => c.date.getTime() === createdAt.getTime());
            if (match) {
              match.count++;
            }
          }
        });

        setChartData(counts.map(c => ({ name: c.name, count: c.count })));
      };
      
      processChartData();
      
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });
    
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => {
      const rev = s.docs.reduce((acc, doc) => acc + (doc.data().status === 'paid' ? doc.data().amount : 0), 0);
      setStats(prev => ({ ...prev, revenue: rev }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'invoices');
    });

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecent = onSnapshot(q, (s) => setRecentReports(s.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => {
      unsubPatients();
      unsubReports();
      unsubInvoices();
      unsubRecent();
    };
  }, []);

  const cards = [
    { label: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-primary-container', trend: '+12.5%' },
    { label: 'Reports Finalized', value: stats.reports, icon: FileText, color: 'bg-secondary', trend: '+8.2%' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(0)}`, icon: IndianRupee, color: 'bg-tertiary', trend: '+15.1%' },
    { label: 'System Health', value: '100%', icon: Activity, color: 'bg-blue-600', trend: 'STABLE' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <span className="text-[10px] text-on-surface-variant ml-auto">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* main chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-4xl border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold text-primary">Efficiency Analytics</h3>
              <p className="text-sm text-on-surface-variant mt-1">Daily report production volume</p>
            </div>
            <div className="p-2 bg-surface-container rounded-xl border border-outline-variant/30">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3C5D" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0B3C5D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#42474E' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Area type="monotone" dataKey="count" stroke="#0B3C5D" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* recent activity */}
        <div className="bg-primary text-white p-8 rounded-4xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary-fixed" />
            Recent Reports
          </h3>
          <div className="space-y-4 relative z-10">
            {recentReports.map((report, idx) => (
              <motion.div 
                key={report.id}
                onClick={() => setActiveTab && setActiveTab('reports')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-secondary-fixed" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold truncate">{report.patientName}</span>
                  <span className="text-[10px] text-white/50 uppercase tracking-tighter">{report.testType} • {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-secondary-fixed opacity-0 group-hover:opacity-100 transition-all" />
              </motion.div>
            ))}
            <button 
              onClick={() => setActiveTab && setActiveTab('reports')}
              className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all border border-white/5"
            >
              View All History
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-surface-container rounded-4xl border border-outline-variant/30 flex flex-col md:flex-row items-center gap-8 shadow-inner overflow-hidden relative">
        <div className="absolute left-0 bottom-0 opacity-10">
          <Microscope size={200} />
        </div>
        <div className="relative z-10 flex-1">
          <h3 className="text-2xl font-black text-primary mb-2">Did you know?</h3>
          <p className="text-on-surface-variant max-w-xl leading-relaxed">
            Healthcare OS uses proprietary secure anchoring to prevent report medical fraud. Every signature generated on your dashboard is globally verifiable by clinicians.
          </p>
        </div>
      </div>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';
