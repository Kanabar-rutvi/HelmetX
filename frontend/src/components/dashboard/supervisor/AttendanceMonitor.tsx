import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, User, HardHat, CheckCircle, AlertCircle, Scan } from 'lucide-react';

export type AttendanceLog = { 
  _id: string; 
  user?: { _id: string; name?: string; role?: string; assignedSite?: string }; 
  deviceId?: string;
  checkInTime?: string; 
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'checked_out';
  duration?: number;
};

interface Props {
  logs: AttendanceLog[];
  overview: { total: number; present: number; late: number; absent: number } | null;
  loading?: boolean;
}

const AttendanceMonitor: React.FC<Props> = ({ logs, overview, loading }) => {
  const navigate = useNavigate();
  const completedCount = logs.filter((r) => !!r.checkOutTime).length;
  
  // Calculate average duration
  const durations = logs
    .filter((r) => r.checkInTime && r.checkOutTime)
    .map((r) => new Date(r.checkOutTime as string).getTime() - new Date(r.checkInTime as string).getTime());
  
  const avgDurationHours = durations.length 
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) / 3600000 * 10) / 10 
    : 0;

  const getStatusBadge = (status: string, checkOutTime?: string) => {
    if (checkOutTime) return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Checked Out</span>;
    if (status === 'present') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">On Site</span>;
    if (status === 'late') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Late</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">Unknown</span>;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="text-slate-700 dark:text-slate-300" size={20} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attendance Monitor</h3>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/supervisor/attendance')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
                <Scan size={16} />
                Verify / Scan
            </button>
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{overview?.present ?? 0}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-ins</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{overview?.total ?? 0}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{completedCount}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Duration</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{avgDurationHours}h</p>
        </div>
      </div>

      {/* Real-time Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Worker</th>
              <th className="px-4 py-3">Helmet ID</th>
              <th className="px-4 py-3">Scan IN</th>
              <th className="px-4 py-3">Scan OUT</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 rounded-r-lg text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No attendance records for today yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {log.user?.name ? log.user.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{log.user?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{log.user?.role || 'Worker'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <HardHat size={12} />
                      {log.deviceId || '--'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(log.status, log.checkOutTime)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    {log.duration ? formatDuration(log.duration) : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceMonitor;
