import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ClipboardCheck } from 'lucide-react';

const ComplianceAnalytics: React.FC = () => {
  const helmetData = [
    { name: 'Compliant', value: 85 },
    { name: 'Non-Compliant', value: 15 },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const attendanceData = [
    { day: 'Mon', present: 45, late: 5 },
    { day: 'Tue', present: 48, late: 2 },
    { day: 'Wed', present: 47, late: 3 },
    { day: 'Thu', present: 44, late: 6 },
    { day: 'Fri', present: 49, late: 1 },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 h-[320px] transition-colors">
      <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <ClipboardCheck size={20} className="text-purple-500" />
        Compliance & Analytics
      </h3>

      <div className="grid grid-cols-2 gap-6 h-[220px]">
        {/* Helmet Compliance Pie */}
        <div className="flex flex-col items-center">
           <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Helmet Compliance</h4>
           <div className="h-full w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={helmetData}
                   cx="50%"
                   cy="50%"
                   innerRadius={45}
                   outerRadius={65}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {helmetData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.95))', color: 'var(--tooltip-text, #1e293b)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    wrapperClassName="dark:!bg-slate-800 dark:!text-white"
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Attendance Bar */}
        <div className="flex flex-col items-center">
           <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Weekly Attendance</h4>
           <div className="h-full w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={attendanceData}>
                 <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                 <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                 />
                 <Bar dataKey="present" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                 <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAnalytics;
