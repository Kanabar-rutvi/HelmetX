import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { AlertTriangle, CheckCircle, Clock, Search, Filter, Bell } from 'lucide-react';

interface Alert {
  _id: string;
  type: string;
  deviceId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  severity: 'critical' | 'warning' | 'info';
  value: string | number | boolean | Record<string, unknown>;
  status: 'new' | 'acknowledged' | 'resolved';
  timestamp: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await api.get<Alert[]>('/alerts');
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchAlerts(); }, 0);
    return () => clearTimeout(t);
  }, [fetchAlerts]);

  const updateStatus = async (id: string, status: 'new' | 'acknowledged' | 'resolved') => {
    try {
      await api.put(`/alerts/${id}`, { status });
      fetchAlerts(); // Refresh list
    } catch (error) {
      console.error('Failed to update alert status', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.type.toLowerCase().includes(filter.toLowerCase()) ||
      alert.deviceId.toLowerCase().includes(filter.toLowerCase()) ||
      alert.user?.name.toLowerCase().includes(filter.toLowerCase()) ||
      String(alert.value).toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Alerts & Incidents</h2>
          <p className="text-slate-500">Manage system alerts and safety incidents</p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Bell size={18} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search alerts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'acknowledged' | 'resolved')}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Severity</th>
                <th className="p-4 font-semibold text-slate-600">Type</th>
                <th className="p-4 font-semibold text-slate-600">User / Device</th>
                <th className="p-4 font-semibold text-slate-600">Details</th>
                <th className="p-4 font-semibold text-slate-600">Time</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading alerts...</td></tr>
              ) : filteredAlerts.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No alerts found</td></tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{alert.type}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-800">{alert.user?.name || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500">{alert.deviceId}</div>
                    </td>
                    <td className="p-4 text-slate-600">{String(alert.value)}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {alert.status === 'new' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={14}/> New</span>}
                      {alert.status === 'acknowledged' && <span className="text-yellow-600 flex items-center gap-1"><Clock size={14}/> Ack</span>}
                      {alert.status === 'resolved' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Resolved</span>}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {alert.status === 'new' && (
                        <button 
                          onClick={() => updateStatus(alert._id, 'acknowledged')}
                          className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button 
                          onClick={() => updateStatus(alert._id, 'resolved')}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAlerts;
