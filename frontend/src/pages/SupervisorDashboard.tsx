import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import io from 'socket.io-client';
import Modal from '../components/Modal'; // Added Modal
import { 
  Users, 
  Briefcase, 
  CloudSun, 
  Bell,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  QrCode // Added QrCode
} from 'lucide-react';

// New Components
import WorkforceMonitor from '../components/dashboard/supervisor/WorkforceMonitor';
import AlertsCommandCenter from '../components/dashboard/supervisor/AlertsCommandCenter';
import SiteMap from '../components/dashboard/supervisor/SiteMap';
import ComplianceAnalytics from '../components/dashboard/supervisor/ComplianceAnalytics';
import SupervisorAIInsights from '../components/dashboard/supervisor/SupervisorAIInsights';

type DeviceItem = { 
  _id?: string; 
  deviceId: string; 
  status?: 'online' | 'offline'; 
  assignedUser?: { name?: string; _id?: string };
  heartRate?: number;
  temperature?: number;
  gasLevel?: number;
  battery?: number;
  helmetOn?: boolean;
};
type AlertSeverity = 'low' | 'medium' | 'critical';
type AlertItem = { id: string; type: string; workerName: string; location: string; timestamp: Date; severity: AlertSeverity; status: 'active' | 'acknowledged' | 'resolved' };
type NotificationItem = { _id: string; title: string; message: string };
type AttendanceLog = { _id: string; user?: { name?: string }; checkInTime?: string; checkOutTime?: string };
type DailyReportListItem = { _id: string; user?: { name?: string }; imageUrl?: string; task: string };
type WorkerView = { _id: string; name: string; deviceId: string; status: 'online' | 'offline'; helmetOn: boolean; heartRate: number; temperature: number; gasLevel: number; battery?: number };

type StatCardProps = { title: string; value: number | string; subValue?: string; icon: React.ComponentType<{ size?: number; className?: string }>; colorClass: string; bgClass: string; onClick?: () => void };
const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, colorClass, bgClass, onClick }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors cursor-pointer" onClick={onClick}>
      <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${colorClass}`}>{value} <span className="text-sm text-slate-400 font-normal ml-1">{subValue}</span></h3>
      </div>
      <div className={`p-4 rounded-xl ${bgClass}`}>
          <Icon size={24} className={colorClass.replace('text-', 'text-opacity-100 ')} />
      </div>
  </div>
);

const SupervisorDashboard = () => {
  const [workers, setWorkers] = useState<WorkerView[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  type Site = { _id?: string; name?: string; location?: { coordinates: [number, number] }; geofenceRadius?: number };
  const [assignedSite, setAssignedSite] = useState<Site | string | null>(null);
  const [weather] = useState({ temp: 28, humidity: 65, condition: 'Sunny' });
  const [overview, setOverview] = useState<{ total: number; present: number; late: number; absent: number } | null>(null);
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);
  const [recentReports, setRecentReports] = useState<DailyReportListItem[]>([]);
  const [materialsStats, setMaterialsStats] = useState<{ pending: number; approved: number; total: number } | null>(null);
  const [materialsRecent, setMaterialsRecent] = useState<Array<{ _id: string; name: string; quantity: number; status: string; user?: { name?: string } }>>([]);

  // Scan & Approval State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [scannedQrInput, setScannedQrInput] = useState('');
  const [approvalData, setApprovalData] = useState<any>(null);

  const workersRef = useRef(workers);
  useEffect(() => { workersRef.current = workers; }, [workers]);

  useEffect(() => {
    if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
       try {
         const [devicesRes, alertsRes, notifRes, profileRes] = await Promise.all([
           api.get('/devices'),
           api.get('/data/alerts'),
           api.get('/notifications'),
           api.get('/auth/me')
         ]);

         const devices: DeviceItem[] = devicesRes.data || [];
         const workersMapped: WorkerView[] = devices.map((d: DeviceItem) => ({
           _id: d._id || d.deviceId,
           name: d.assignedUser?.name || d.deviceId,
           deviceId: d.deviceId,
           status: d.status || 'offline',
           helmetOn: !!d.helmetOn,
           heartRate: d.heartRate || 0,
           temperature: d.temperature || 0,
           gasLevel: d.gasLevel || 0,
           battery: d.battery
         }));
         setWorkers(workersMapped);
         type ApiAlert = { _id: string; type: string; severity: AlertSeverity; device?: { assignedUser?: { name?: string } }; deviceId?: string; timestamp: string };
         setAlerts((alertsRes.data || []).map((a: ApiAlert): AlertItem => {
           const sev: AlertSeverity = a.severity === 'critical' || a.severity === 'medium' || a.severity === 'low' ? a.severity : 'low';
           return {
             id: a._id,
             type: a.type,
             workerName: a.device?.assignedUser?.name ?? a.deviceId ?? 'Unknown',
             location: 'Zone A', // Mock location for now
             timestamp: new Date(a.timestamp),
             severity: sev,
             status: 'active'
           };
         }));
         setNotifications(notifRes.data as NotificationItem[]);
         
         if (profileRes.data.assignedSite) {
            if (typeof profileRes.data.assignedSite === 'string') {
                try {
                    const siteRes = await api.get(`/sites/${profileRes.data.assignedSite}`);
                    setAssignedSite(siteRes.data);
                } catch (e) { console.error(e); }
            } else {
                setAssignedSite(profileRes.data.assignedSite);
            }
         }
         
         // Day Summary (Attendance overview + today's logs)
         try {
           const siteId = (profileRes.data.assignedSite && typeof profileRes.data.assignedSite === 'object')
             ? profileRes.data.assignedSite._id
             : profileRes.data.assignedSite;
           const todayStr = new Date().toISOString().split('T')[0];
           const [overviewRes, todayRes, reportsRes] = await Promise.all([
             api.get('/attendance/overview', { params: { siteId } }),
             api.get('/attendance/today', { params: { siteId } }),
             api.get('/reports/all', { params: { siteId, startDate: todayStr, endDate: todayStr } })
           ]);
           setOverview(overviewRes.data);
           setTodayLogs((todayRes.data || []) as AttendanceLog[]);
           setRecentReports(((reportsRes.data || []) as DailyReportListItem[]).slice(0, 6));
           try {
             const ms = await api.get('/reports/materials/stats');
             setMaterialsStats(ms.data || null);
           } catch (e) { console.error(e); }
           try {
             const listParams = siteId ? { params: { siteId } } : undefined;
             const ml = await api.get('/reports/materials/list', listParams as { params?: { siteId?: string } });
             setMaterialsRecent((ml.data || []).filter((x: { status: string }) => x.status !== 'pending').slice(0, 6));
           } catch (e) { console.error(e); }
         } catch (e) { console.error(e); }

       } catch (error) {
         console.error("Dashboard fetch error:", error);
       }
    };
    fetchData();

    const socketUrl = (import.meta as ImportMeta).env?.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    
    socket.on('sensor_update', (payload: { deviceId: string; data?: Partial<{ heartRate: number; temperature: number; gasLevel: number; battery?: number; helmetOn?: boolean }> }) => {
       setWorkers(prev => prev.map((w) => w.deviceId === payload.deviceId ? {
         ...w,
         heartRate: payload.data?.heartRate ?? w.heartRate,
         temperature: payload.data?.temperature ?? w.temperature,
         gasLevel: payload.data?.gasLevel ?? w.gasLevel,
         battery: payload.data?.battery ?? w.battery,
         helmetOn: payload.data?.helmetOn ?? w.helmetOn,
         status: 'online'
       } : w));
    });

    socket.on('new_alert', (alert: { type: string; severity: AlertSeverity; deviceId: string }) => {
       const currentWorkers = workersRef.current;
       const worker = currentWorkers.find(w => w.deviceId === alert.deviceId);
       const workerName = worker?.name || alert.deviceId;

       setAlerts(prev => [{
           id: Math.random().toString(),
           type: alert.type,
           workerName: workerName,
           location: 'Unknown',
           timestamp: new Date(),
           severity: alert.severity,
           status: 'active'
       }, ...prev]);

       if (alert.severity === 'critical' || alert.type === 'helmet_off') {
           const title = alert.type === 'helmet_off' ? 'Helmet Removed!' : `Critical Alert: ${alert.type}`;
           const message = `${workerName} has triggered an alert.`;
           
           setNotifications(prev => [{
               _id: Math.random().toString(),
               title,
               message
           }, ...prev]);
           
           if (Notification.permission === "granted") {
               new Notification(title, { body: message });
           }
       }
    });
    
    socket.on('materials_updated', async () => {
      try {
        const ms = await api.get('/reports/materials/stats');
        setMaterialsStats(ms.data || null);
      } catch { /* noop */ }
      try {
        const prof = await api.get('/auth/me');
        const siteId = (prof.data.assignedSite && typeof prof.data.assignedSite === 'object')
          ? prof.data.assignedSite._id
          : prof.data.assignedSite;
        const listParams = siteId ? { params: { siteId } } : undefined;
        const ml = await api.get('/reports/materials/list', listParams as { params?: { siteId?: string } });
        setMaterialsRecent((ml.data || []).filter((x: { status: string }) => x.status !== 'pending').slice(0, 6));
      } catch { /* noop */ }
    });
    
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    const handler = async () => {
      try {
        const ms = await api.get('/reports/materials/stats');
        setMaterialsStats(ms.data || null);
      } catch { /* noop */ }
      try {
        const prof = await api.get('/auth/me');
        const siteId = (prof.data.assignedSite && typeof prof.data.assignedSite === 'object')
          ? prof.data.assignedSite._id
          : prof.data.assignedSite;
        const listParams = siteId ? { params: { siteId } } : undefined;
        const ml = await api.get('/reports/materials/list', listParams as { params?: { siteId?: string } });
        setMaterialsRecent((ml.data || []).filter((x: { status: string }) => x.status !== 'pending').slice(0, 6));
      } catch { /* noop */ }
    };
    window.addEventListener('materials-updated', handler as EventListener);
    return () => window.removeEventListener('materials-updated', handler as EventListener);
  }, []);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await api.post('/attendance/scan-qr', { qrPayload: scannedQrInput });
        setApprovalData(res.data);
        setIsScanModalOpen(false);
        setIsApprovalModalOpen(true);
        setScannedQrInput('');
    } catch (error: any) {
        alert(error.response?.data?.message || 'Scan failed');
    }
  };

  const handleApprove = async () => {
    try {
        await api.post('/attendance/approve', { 
            workerId: approvalData.worker.id,
            helmetId: approvalData.helmetId,
            action: approvalData.action,
            attendanceId: approvalData.attendanceId
        });
        setIsApprovalModalOpen(false);
        setApprovalData(null);
        alert('Attendance Approved Successfully');
        // Refresh logs and overview
        const todayStr = new Date().toISOString().split('T')[0];
        const siteId = (typeof assignedSite === 'object' && assignedSite) ? (assignedSite as any)._id : assignedSite;
        
        const [todayRes, overviewRes] = await Promise.all([
            api.get('/attendance/today', { params: { siteId } }),
            api.get('/attendance/overview', { params: { siteId } })
        ]);
        
        setTodayLogs((todayRes.data || []) as AttendanceLog[]);
        setOverview(overviewRes.data);
    } catch (error: any) {
        alert(error.response?.data?.message || 'Approval failed');
    }
  };

  const activeWorkers = workers.filter(w => w.status === 'online');
  const completedCount = todayLogs.filter((r) => !!r.checkOutTime).length;
  const durations = todayLogs
    .filter((r) => r.checkInTime && r.checkOutTime)
    .map((r) => new Date(r.checkOutTime as string).getTime() - new Date(r.checkInTime as string).getTime());
  const avgDurationHours = durations.length ? Math.round((durations.reduce((a: number, b: number) => a + b, 0) / durations.length) / 3600000 * 10) / 10 : 0;

  return (
    <Layout role="supervisor">
      <div className="space-y-6 relative max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Supervisor Command Center</h1>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time site monitoring and safety oversight.</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
             <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl text-blue-700 dark:text-blue-400 text-sm font-medium border border-blue-100 dark:border-blue-800">
                <CloudSun size={18} />
                <span>{weather.temp}°C, {weather.condition}</span>
             </div>
             <div className="relative cursor-pointer group" onClick={() => setShowNotifications(!showNotifications)}>
                <div className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Bell size={24} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                        {notifications.length}
                    </span>
                )}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-20">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h4>
                      <button 
                        className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          try { 
                            await api.put('/notifications/read-all'); 
                            setNotifications([]); 
                          } catch { alert('Failed to mark all as read'); } 
                        }}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No unread notifications</p>
                      ) : (
                        notifications.map((n: NotificationItem) => (
                          <div key={n._id} className="p-2 rounded border border-slate-100 dark:border-slate-700 flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.message}</p>
                            </div>
                            <button 
                              className="text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                try { 
                                  await api.put(`/notifications/${n._id}/read`); 
                                  setNotifications(prev => prev.filter(x => x._id !== n._id)); 
                                } catch { alert('Failed to mark as read'); } 
                              }}
                            >
                              Read
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Active Workers" 
                value={activeWorkers.length} 
                subValue={`/ ${workers.length}`}
                icon={Users}
                colorClass="text-slate-800 dark:text-white"
                bgClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                onClick={() => document.getElementById('workforce-section')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <StatCard 
                title="Active Alerts" 
                value={alerts.filter(a => a.status === 'active').length} 
                subValue=""
                icon={AlertTriangle}
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-50 dark:bg-red-900/20 text-red-600"
                onClick={() => document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <StatCard 
                title="Current Site" 
                value={typeof assignedSite === 'object' ? (assignedSite?.name || 'Unassigned') : 'Unassigned'} 
                subValue=""
                icon={MapPin}
                colorClass="text-slate-800 dark:text-white truncate"
                bgClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <StatCard 
                title="Safety Score" 
                value="94%" 
                subValue=""
                icon={ShieldCheck}
                colorClass="text-green-600 dark:text-green-400"
                bgClass="bg-green-50 dark:bg-green-900/20 text-green-600"
            />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column: Map & Monitor */}
           <div className="lg:col-span-2 space-y-6">
               <div id="map-section">
               <SiteMap 
                  workers={activeWorkers} 
                  center={typeof assignedSite === 'object' && assignedSite?.location?.coordinates ? [assignedSite.location.coordinates[1], assignedSite.location.coordinates[0]] : [19.0760, 72.8777]}
                  geofenceRadius={typeof assignedSite === 'object' ? (assignedSite?.geofenceRadius || 500) : 500}
               />
               </div>
               <div id="workforce-section">
                 <WorkforceMonitor workers={workers} />
               </div>
               
               {/* Attendance Monitor Table */}
               <AttendanceMonitor logs={todayLogs} overview={overview} />
           </div>

           {/* Right Column: Alerts & Analytics */}
           <div className="space-y-6">
              <SupervisorAIInsights />
              {materialsStats && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Materials Overview</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{materialsStats.pending}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Approved</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{materialsStats.approved}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{materialsStats.total}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Materials</h3>
                </div>
                {materialsRecent.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No approved/rejected materials yet.</p>
                ) : (
                  <div className="space-y-2">
                    {materialsRecent.map((m) => (
                      <div key={m._id} className="flex justify-between items-center p-2 rounded border border-slate-100 dark:border-slate-700 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-white">{m.name} × {m.quantity}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">{m.user?.name || 'Worker'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.status === 'approved' ? 'bg-green-100 text-green-700' :
                          m.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{m.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Recent DPRs */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Recent DPRs</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{recentReports.length} today</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {recentReports.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No reports submitted yet.</p>
                  ) : (
                    recentReports.map((r: DailyReportListItem) => {
                      const origin = (api.defaults?.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : ((import.meta as ImportMeta).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'));
                      return (
                        <div key={r._id} className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border">
                            {r.imageUrl ? (
                              <img src={`${origin}${r.imageUrl}`} alt={r.user?.name || 'Report'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">No image</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{r.user?.name || 'Worker'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.task}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div id="alerts-section">
                <AlertsCommandCenter alerts={alerts} />
              </div>
              <ComplianceAnalytics />
           </div>
        </div>
      </div>

      {/* Scan QR Modal */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="Scan Worker Helmet QR">
        <form onSubmit={handleScanSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scan QR Code</label>
                <input 
                    type="text" 
                    autoFocus
                    placeholder="Place cursor here and scan..." 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={scannedQrInput}
                    onChange={e => setScannedQrInput(e.target.value)}
                    required
                />
                <p className="text-xs text-gray-500 mt-2">
                    Ensure input is focused before scanning with the handheld scanner.
                </p>
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={() => setIsScanModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Process Scan</button>
            </div>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title={approvalData?.action === 'CHECK_IN' ? 'Approve Check-In' : 'Approve Check-Out'}>
        {approvalData && (
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Worker Name</p>
                            <p className="font-medium text-lg">{approvalData.worker.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Role</p>
                            <p className="font-medium">{approvalData.worker.role}</p>
                        </div>
                        {approvalData.action === 'CHECK_IN' && (
                            <>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Shift</p>
                                    <p className="font-medium">{approvalData.shift.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Time</p>
                                    <p className="font-medium">{approvalData.shift.startTime} - {approvalData.shift.endTime}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleApprove}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
                    >
                        {approvalData.action === 'CHECK_IN' ? 'Approve & Mark Attendance' : 'Approve Check-Out'}
                    </button>
                    <button 
                        onClick={() => setIsApprovalModalOpen(false)}
                        className="w-full py-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
      </Modal>
    </Layout>
  );
};

// Sub-components (assuming they are defined elsewhere or inline)
const AttendanceMonitor = ({ logs, overview }: { logs: AttendanceLog[], overview: any }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Today's Attendance</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
            <th className="pb-3 pl-2">Worker</th>
            <th className="pb-3">Check In</th>
            <th className="pb-3">Check Out</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {logs.slice(0, 5).map(log => (
            <tr key={log._id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="py-3 pl-2 font-medium text-slate-700 dark:text-slate-300">{log.user?.name || 'Unknown'}</td>
              <td className="py-3 text-slate-500 dark:text-slate-400">{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
              <td className="py-3 text-slate-500 dark:text-slate-400">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  log.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {log.checkOutTime ? 'COMPLETED' : 'PRESENT'}
                </span>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={4} className="py-4 text-center text-slate-500">No attendance records today</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default SupervisorDashboard;
