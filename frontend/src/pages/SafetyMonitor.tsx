import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import io from 'socket.io-client';
import { ShieldCheck, AlertTriangle, Activity, Thermometer, Flame, Heart, Battery, Wifi, HardHat } from 'lucide-react';

interface Vitals {
  temperature?: number;
  gasLevel?: number;
  heartRate?: number;
  battery?: number;
  helmetOn?: boolean;
}

const SafetyMonitor = ({ role = 'supervisor', embedded = false }: { role?: 'supervisor' | 'admin', embedded?: boolean }) => {
  type Device = { _id?: string; deviceId: string; status?: 'online' | 'offline'; assignedUser?: { name?: string; email?: string } };
  type AlertItem = { _id: string; type: string; severity: 'low' | 'medium' | 'critical'; deviceId: string; status?: string };
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [vitalsByDevice, setVitalsByDevice] = useState<Record<string, Vitals>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const { data: devs } = await api.get('/devices');
        setDevices(devs as Device[]);
        const { data: al } = await api.get('/data/alerts');
        setAlerts(al as AlertItem[]);
        const vitalsEntries: Record<string, Vitals> = {};
        for (const d of (devs as Device[])) {
          try {
            const sr = await api.get(`/data/sensors/${d.deviceId}`);
            const latest = sr.data?.[0];
            if (latest) {
              vitalsEntries[d.deviceId] = {
                temperature: latest.temperature,
                gasLevel: latest.gasLevel,
                heartRate: latest.heartRate,
                battery: latest.battery,
                helmetOn: latest.helmetOn
              };
            }
          } catch (e) { console.error(e); }
        }
        setVitalsByDevice(vitalsEntries);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();

    const socketUrl = (import.meta as ImportMeta).env?.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socket.on('sensor_update', (payload: { deviceId: string; data?: Vitals }) => {
      setVitalsByDevice(prev => ({
        ...prev,
        [payload.deviceId]: {
          temperature: payload.data?.temperature,
          gasLevel: payload.data?.gasLevel,
          heartRate: payload.data?.heartRate,
          battery: payload.data?.battery,
          helmetOn: payload.data?.helmetOn
        }
      }));
      setDevices(prev => prev.map(d => d.deviceId === payload.deviceId ? { ...d, ...payload.data } : d));
    });
    socket.on('new_alert', (alert: AlertItem) => setAlerts(prev => [alert, ...prev]));
    socket.on('device_status', (payload: { deviceId: string; status: 'online' | 'offline' }) => {
      setDevices(prev => prev.map(d => d.deviceId === payload.deviceId ? { ...d, status: payload.status } : d));
    });
    return () => { socket.disconnect(); };
  }, []);

  const onlineCount = useMemo(() => devices.filter(d => d.status === 'online').length, [devices]);
  const alertsCount = useMemo(() => alerts.filter(a => a.severity === 'critical').length, [alerts]);
  const safeCount = useMemo(() => {
    let count = 0;
    for (const d of devices) {
      const v = vitalsByDevice[d.deviceId] || {};
      const noCritical = alerts.filter(a => a.deviceId === d.deviceId && a.severity === 'critical' && a.status === 'new').length === 0;
      const helmetOk = v.helmetOn !== false;
      const gasOk = (v.gasLevel ?? 0) <= 400;
      const tempOk = (v.temperature ?? 0) <= 38;
      const isOnline = d.status === 'online';
      if (isOnline && noCritical && helmetOk && gasOk && tempOk) count++;
    }
    return count;
  }, [devices, alerts, vitalsByDevice]);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {!embedded && <h1 className="text-2xl font-bold text-gray-800">Safety Monitor</h1>}
          {!embedded && <p className="text-gray-500">Real-time worker safety monitoring</p>}
        </div>
        {!embedded && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><Wifi size={14}/> Live</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-600 dark:bg-opacity-20 dark:text-emerald-400"><ShieldCheck/></div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Safe</div>
              <div className="text-3xl font-bold">{safeCount}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100 text-red-600 dark:bg-red-600 dark:bg-opacity-20 dark:text-red-400"><AlertTriangle/></div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Alerts</div>
              <div className="text-3xl font-bold">{alertsCount}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-600 dark:bg-opacity-20 dark:text-blue-400"><Activity/></div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Online</div>
              <div className="text-3xl font-bold">{onlineCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-6 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 rounded-xl shadow-sm">Loading...</div>
        ) : devices.map((d) => {
          const v = vitalsByDevice[d.deviceId] || {};
          const ok = d.status === 'online';
          return (
            <div key={d._id || d.deviceId} className="bg-white dark:bg-slate-900 rounded-xl p-6 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold">{d.assignedUser?.name || d.deviceId}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{d.assignedUser?.email || 'Unassigned'}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-600 dark:bg-opacity-20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>{ok ? 'OK' : 'OFF'}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2">
                  <Thermometer className="text-orange-500 dark:text-orange-400" size={16}/> <span className="text-sm">{v.temperature ?? '--'}°</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2">
                  <Flame className="text-red-500 dark:text-red-400" size={16}/> <span className="text-sm">{v.gasLevel ?? '--'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2">
                  <Heart className="text-pink-500 dark:text-pink-400" size={16}/> <span className="text-sm">{v.heartRate ?? '--'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2">
                  <Battery className="text-emerald-500 dark:text-emerald-400" size={16}/> <span className="text-sm">{v.battery ?? '--'}%</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2">
                   <HardHat className={v.helmetOn ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"} size={16}/> <span className="text-sm">{v.helmetOn ? 'On' : 'Off'}</span>
                </div>
                <div className={`bg-slate-50 dark:bg-slate-800 rounded p-3 flex items-center gap-2 ${v.alert ? 'bg-red-100 dark:bg-red-900/50 animate-pulse' : ''}`}>
                   <div className={`w-3 h-3 rounded-full ${v.alert ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-300'}`}></div> <span className={`text-sm font-bold ${v.alert ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{v.alert ? 'LED ON' : 'LED OFF'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (embedded) return content;
  return (
    <Layout role={role}>
      {content}
    </Layout>
  );
};

export default SafetyMonitor;
