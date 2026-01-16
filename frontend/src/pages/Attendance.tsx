import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Calendar, Clock, ArrowRight, CheckCircle, LogIn, LogOut } from 'lucide-react';

const Attendance = () => {
  type DailyItem = { _id: string; checkInTime: string; checkOutTime?: string; date: string };
  type HistoryItem = { _id: string; date: string; checkInTime?: string; checkOutTime?: string };
  const [daily, setDaily] = useState<DailyItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    try {
      const d = await api.get<DailyItem[]>('/attendance/me/daily');
      setDaily(d.data || []);
      const h = await api.get<HistoryItem[]>(`/attendance/me/history?days=${days}`);
      setHistory(h.data || []);
    } catch (e) { console.error(e); }
  }, [days]);

  useEffect(() => { 
    const t = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Layout role="worker">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Attendance Log
        </h1>
        
        {/* Today's Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            Today's Activity
          </h3>
          
          {daily.length === 0 ? (
             <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No attendance records for today</p>
                <p className="text-xs text-gray-400 mt-1">Scan your helmet QR to check in</p>
             </div>
          ) : (
            <div className="grid gap-4">
              {daily.map((r) => (
                <div key={r._id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <LogIn size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Check In</p>
                            <p className="text-lg font-bold text-gray-800">{formatTime(r.checkInTime)}</p>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 items-center justify-center px-4">
                        <div className="h-0.5 bg-blue-200 w-full relative">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-blue-50 px-2 text-xs text-blue-400 font-medium">
                                {r.checkOutTime ? calculateDuration(r.checkInTime, r.checkOutTime) : 'Active'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.checkOutTime ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                            <LogOut size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Check Out</p>
                            <p className="text-lg font-bold text-gray-800">{formatTime(r.checkOutTime)}</p>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                History
              </h3>
              <select 
                value={days} 
                onChange={(e) => setDays(Number(e.target.value))} 
                className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Check In</th>
                            <th className="px-6 py-4">Check Out</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No attendance history found</td>
                            </tr>
                        ) : (
                            history.map((r) => (
                                <tr key={r._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{r.date}</td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">{formatTime(r.checkInTime)}</td>
                                    <td className="px-6 py-4 text-orange-600 font-medium">{formatTime(r.checkOutTime)}</td>
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{calculateDuration(r.checkInTime, r.checkOutTime)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${r.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {r.checkOutTime ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {r.checkOutTime ? 'Completed' : 'On Shift'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Attendance;
