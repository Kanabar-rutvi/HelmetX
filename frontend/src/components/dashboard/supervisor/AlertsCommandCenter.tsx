import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, MoreVertical } from 'lucide-react';
import api from '../../../utils/api';

interface Alert {
  id: string;
  type: string;
  workerName: string;
  location: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AlertsCommandCenterProps {
  alerts: Alert[];
}

const AlertsCommandCenter: React.FC<AlertsCommandCenterProps> = ({ alerts }) => {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [items, setItems] = useState(alerts);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'medium': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      default: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900';
    }
  };

  const updateStatus = async (id: string, status: 'acknowledged' | 'resolved') => {
    try {
      setUpdatingId(id);
      await api.put(`/alerts/${id}`, { status });
      setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      alert('Failed to update alert');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[400px] transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          Safety Alerts Command Center
        </h3>
        <div className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
          {items.filter(a => a.status === 'active').length} Active
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
             <CheckCircle size={48} className="text-green-400 dark:text-green-500/50 mb-3 opacity-50" />
             <p className="font-medium">All clear. No active alerts.</p>
          </div>
        ) : (
          items.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${getSeverityColor(alert.severity)} transition-all hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span className="font-bold uppercase text-xs tracking-wide">{alert.type}</span>
                </div>
                <span className="text-[10px] opacity-75 font-mono font-medium">{alert.timestamp.toLocaleTimeString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Worker</span>
                  <span className="font-bold">{alert.workerName}</span>
                </div>
                <div>
                  <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Location</span>
                  <span className="font-bold">{alert.location}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button 
                  className="flex-1 bg-white/60 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/40 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-60" 
                  onClick={() => updateStatus(alert.id, 'acknowledged')}
                  disabled={updatingId === alert.id}
                >
                  {alert.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                </button>
                <button 
                  className="flex-1 bg-white/60 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/40 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-60" 
                  onClick={() => updateStatus(alert.id, 'resolved')}
                  disabled={updatingId === alert.id}
                >
                  {alert.status === 'resolved' ? 'Resolved' : 'Resolve'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsCommandCenter;
