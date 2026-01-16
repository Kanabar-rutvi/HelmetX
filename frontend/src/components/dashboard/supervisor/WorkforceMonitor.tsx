import React, { useState } from 'react';
import { Search, Filter, Battery, Signal, User, AlertTriangle } from 'lucide-react';

interface Worker {
  _id: string;
  name: string;
  deviceId: string;
  status: 'online' | 'offline';
  helmetOn: boolean;
  heartRate: number;
  temperature: number;
  gasLevel: number;
  battery?: number;
}

interface WorkforceMonitorProps {
  workers: Worker[];
}

const WorkforceMonitor: React.FC<WorkforceMonitorProps> = ({ workers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const filteredWorkers = workers.filter(w => 
    (w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || w.deviceId.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filter === 'all' || w.status === filter)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[500px] transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Live Workforce Monitoring</h3>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search worker..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilter(v => !v)} className="relative p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Filter size={18} />
            {showFilter && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10">
                <button className={`w-full text-left px-3 py-2 text-sm rounded-t-xl ${filter === 'all' ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`} onClick={() => { setFilter('all'); setShowFilter(false); }}>
                  All
                </button>
                <button className={`w-full text-left px-3 py-2 text-sm ${filter === 'online' ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`} onClick={() => { setFilter('online'); setShowFilter(false); }}>
                  Online
                </button>
                <button className={`w-full text-left px-3 py-2 text-sm rounded-b-xl ${filter === 'offline' ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`} onClick={() => { setFilter('offline'); setShowFilter(false); }}>
                  Offline
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-3 rounded-l-lg font-bold tracking-wider">Worker</th>
              <th className="px-3 py-3 font-bold tracking-wider">Helmet</th>
              <th className="px-3 py-3 font-bold tracking-wider">Vitals</th>
              <th className="px-3 py-3 rounded-r-lg font-bold tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredWorkers.map((worker) => (
              <tr key={worker._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                      {worker.name ? worker.name.charAt(0) : 'W'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{worker.name || worker.deviceId}</div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{worker.deviceId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${worker.helmetOn ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'}`}>
                    {worker.helmetOn ? 'Worn' : 'Off'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">HR:</span>
                      <span className={`font-mono font-bold ${worker.heartRate > 100 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {worker.heartRate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Gas:</span>
                      <span className={`font-bold ${worker.gasLevel > 200 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {worker.gasLevel > 200 ? 'High' : 'Safe'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${worker.status === 'online' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="text-slate-600 dark:text-slate-400 capitalize font-medium text-xs">{worker.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkforceMonitor;
