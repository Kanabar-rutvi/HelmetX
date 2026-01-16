import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Calendar, HardHat, Activity, Upload, Plus, Trash2, CheckCircle, X } from 'lucide-react';
import io from 'socket.io-client';
import { format } from 'date-fns';
import api from '../utils/api';

// New Components
import HelmetStatusCard from '../components/dashboard/worker/HelmetStatusCard';
import AttendanceScannerCard from '../components/dashboard/worker/AttendanceScannerCard';
import SafetyAlertsPanel, { type Alert } from '../components/dashboard/worker/SafetyAlertsPanel';
import VitalsTrendChart from '../components/dashboard/worker/VitalsTrendChart';
import AIInsightsCard from '../components/dashboard/worker/AIInsightsCard';
import GeoLocationCard from '../components/dashboard/worker/GeoLocationCard';
import EmergencyCard from '../components/dashboard/worker/EmergencyCard';
import ShiftTimeline from '../components/dashboard/worker/ShiftTimeline';
import SafetyScoreCard from '../components/dashboard/worker/SafetyScoreCard';

const WorkerDashboard = () => {
  const { user } = useAuth();
  type SensorData = { heartRate: number; temperature: number; gasLevel: number; battery?: number; lat?: number; lng?: number; helmetOn?: boolean; signal?: number; humidity?: number; accel?: any; alert?: boolean };
  const [data, setData] = useState<SensorData | null>(null);
  const [status, setStatus] = useState('offline');
  type MyDevice = { deviceId: string; status?: string; assignedUser?: string | { _id?: string } };
  const [myDevice, setMyDevice] = useState<MyDevice | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<{ time: string; value: number; type: 'heartRate' | 'temperature' }[]>([]);
  const [materialsList, setMaterialsList] = useState<Array<{ _id: string; name: string; quantity: number; status: string }>>([]);
  
  // Attendance State
  const [attendance, setAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Form States
  const [task, setTask] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [materials, setMaterials] = useState<Array<{ name: string; quantity: number; note?: string }>>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const generateRandomHeartRate = (base?: number) => {
    const center = base && base > 0 ? base : 80;
    const variation = Math.random() * 10 - 5;
    const hr = Math.round(center + variation);
    return Math.min(120, Math.max(60, hr));
  };

  const generateRandomTemperature = (base?: number) => {
    const center = base && base > 0 ? base : 36;
    const variation = Math.random() * 0.6 - 0.3;
    const temp = Math.round((center + variation) * 10) / 10;
    return Math.min(42, Math.max(20, temp));
  };

  useEffect(() => {
    const fetchMyDevice = async () => {
        try {
            const { data: devices } = await api.get('/devices');
            const device = (devices as MyDevice[]).find((d) => {
                const assigned = d.assignedUser;
                const assignedId = typeof assigned === 'object' ? assigned?._id : assigned;
                return assignedId === user?._id;
            });
            if (device) {
                setMyDevice(device);
                setStatus(device.status || 'offline');
            }
        } catch (error) {
            console.error("Error fetching device", error);
        }
    };

    if (user) {
        fetchMyDevice();
    }
  }, [user]);

  useEffect(() => {
    if (!myDevice) return;

    const socketUrl = (import.meta as ImportMeta).env?.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      timeout: 10000,
      path: '/socket.io'
    });
    
    // Initial Fetch
    (async () => {
      try {
        const res = await api.get(`/data/sensors/${myDevice.deviceId}`);
        const latest = res.data?.[0];
        if (latest) {
          const randomHR = generateRandomHeartRate(latest.heartRate);
          setData({
            heartRate: randomHR,
            temperature: latest.temperature,
            gasLevel: latest.gasLevel,
            battery: latest.battery,
            lat: latest.latitude ?? latest.lat,
            lng: latest.longitude ?? latest.lng,
            helmetOn: latest.helmetOn ?? false,
            alert: latest.alert
          });
        }
        
        // Fetch Alerts
        const alertsRes = await api.get('/data/alerts?mine=true');
        setAlerts(alertsRes.data.map((a: { _id: string; type: string; value?: string; timestamp: string; severity: 'low' | 'medium' | 'critical' }) => ({
            id: a._id,
            type: a.type,
            message: a.value || `${a.type} Detected`,
            timestamp: new Date(a.timestamp),
            severity: a.severity,
            status: 'active' // simplifying for demo
        })));

        // Optionally fetch today's report if needed (omitted)

        // Fetch Materials list (to reflect approvals)
        try {
          const matRes = await api.get('/reports/materials/list');
          setMaterialsList((matRes.data || []).slice(0, 5));
        } catch (e) { console.error(e); }

      } catch (e) { console.error(e); }
    })();
    
    socket.on('sensor_update', (payload: { deviceId: string; data: SensorData }) => {
       if (payload.deviceId === myDevice.deviceId) {
           setData(payload.data as SensorData);
           setStatus('online');
       }
    });

    socket.on('device_status', (payload: { deviceId: string; status: string }) => {
       if (payload.deviceId === myDevice.deviceId) {
           setStatus(payload.status);
       }
    });

    socket.on('new_alert', (alert: { deviceId: string; type: string; value: string; severity: 'low' | 'medium' | 'critical' }) => {
      if (alert.deviceId === myDevice.deviceId) {
        const allowed: Alert['type'][] = ['GAS', 'FALL', 'HEART_RATE', 'HELMET_OFF', 'DISCONNECT', 'SOS'];
        const t = allowed.includes(alert.type as Alert['type']) ? (alert.type as Alert['type']) : 'GAS';
        setAlerts(prev => [{
          id: Math.random().toString(),
          type: t,
          message: alert.value,
          timestamp: new Date(),
          severity: alert.severity,
          status: 'active'
        }, ...prev]);
      }
    });
    
    socket.on('materials_updated', async () => {
      try {
        const matRes = await api.get('/reports/materials/list');
        setMaterialsList((matRes.data || []).slice(0, 5));
      } catch { /* noop */ }
    });

    socket.on('attendance_notification', (payload: any) => {
        if (payload.workerId === user?._id) {
            setNotification({ message: payload.message, type: 'success' });
            setTimeout(() => setNotification(null), 5000);
        }
    });

    return () => { socket.disconnect(); };
  }, [myDevice]);

  useEffect(() => {
    const handler = async () => {
      try {
        const matRes = await api.get('/reports/materials/list');
        setMaterialsList((matRes.data || []).slice(0, 5));
      } catch { /* noop */ }
    };
    window.addEventListener('materials-updated', handler as EventListener);
    return () => window.removeEventListener('materials-updated', handler as EventListener);
  }, []);

  useEffect(() => {
    const timer: number = window.setInterval(async () => {
      try {
        const matRes = await api.get('/reports/materials/list');
        setMaterialsList((matRes.data || []).slice(0, 5));
      } catch { /* noop */ }
    }, 10000);
    return () => { if (timer) window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const interval: number = window.setInterval(() => {
      setData(prev => {
        if (!prev) return prev;
        const nextHr = generateRandomHeartRate(prev.heartRate);
        const nextTemp = generateRandomTemperature(prev.temperature);
        setVitalsHistory(prevHist => {
          const now = new Date().toLocaleTimeString();
          const newHr = { time: now, value: nextHr, type: 'heartRate' as const };
          const newTemp = { time: now, value: nextTemp, type: 'temperature' as const };
          return [...prevHist.slice(-18), newHr, newTemp];
        });
        return { ...prev, heartRate: nextHr, temperature: nextTemp };
      });
    }, 1000);
    return () => { if (interval) window.clearInterval(interval); };
  }, []);

  // Generate Insights based on data
  const getInsights = () => {
      if (!data) return [];

      const insights = [];
      
      // Heart Rate Insights
      if (data.heartRate > 100) {
        insights.push("Your heart rate is elevated. Please take a moment to rest and hydrate.");
      } else if (data.heartRate < 50 && data.heartRate > 0) {
        insights.push("Your heart rate is unusually low. Please check your sensor or seek assistance.");
      } else {
        insights.push("Your heart rate has been stable during this shift.");
      }
      
      // Environmental Insights
      if (data.gasLevel < 50) {
        insights.push("Air quality is excellent in your current zone.");
      } else if (data.gasLevel > 100) {
        insights.push("Warning: Elevated gas levels detected. Please proceed with caution.");
      }
      
      // Helmet Insights
      if (data.helmetOn) {
        insights.push("Great job keeping your helmet on! Compliance is 100%.");
      } else {
        insights.push("Safety Alert: Please ensure your helmet is properly secured immediately.");
      }

      // Temperature Insights
      if (data.temperature > 38) {
        insights.push("High body temperature detected. Risk of heat stress.");
      }

      return insights;
  };

  // Attendance Fetcher
  const fetchAttendance = async () => {
    try {
        const res = await api.get('/attendance/my-daily');
        if (res.data && res.data.length > 0) {
            setAttendance(res.data[0]);
        } else {
            setAttendance(null);
        }
    } catch (error) {
        console.error("Attendance fetch error", error);
    } finally {
        setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    
    // Listen for real-time attendance updates
    const socketUrl = (import.meta as ImportMeta).env?.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io'
    });

    socket.on('attendance-update', (payload: any) => {
        // Since payload.record might be generic, verify if it belongs to this user if possible
        // Ideally we filter by userId, but for now simple refresh is safe
        fetchAttendance();
    });

    return () => { socket.disconnect(); };
  }, []);

  // Form Handlers
  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview('');
    }
  };

  const handleAddMaterialRow = () => {
    setMaterials(prev => [...prev, { name: '', quantity: 1, note: '' }]);
  };

  const handleMaterialChange = (index: number, field: 'name' | 'quantity' | 'note', value: string) => {
    setMaterials(prev => prev.map((m, i) => i === index ? { ...m, [field]: field === 'quantity' ? Number(value) : value } : m));
  };
  
  const handleRemoveMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async () => {
    try {
      const imageData = imageFile ? await toBase64(imageFile) : undefined;
      await api.post('/reports/me', { task, imageData, materials: materials.filter(m => m.name && m.quantity) });
      setTask('');
      setImageFile(null);
      setImagePreview('');
      setMaterials([]);
      alert('Daily report submitted');
    } catch (err: unknown) {
      const msg = (typeof err === 'object' && err && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message) 
        || (err instanceof Error ? err.message : 'Failed to submit report');
      alert(msg);
    }
  };

  const handleSOS = async () => {
    if (confirm('Are you sure you want to trigger an SOS alert?')) {
      try {
        await api.post('/data/alerts', {
          type: 'SOS',
          severity: 'critical',
          value: 'Worker requested immediate assistance',
          timestamp: new Date(),
          deviceId: myDevice?.deviceId || 'UNKNOWN',
          userId: user?._id
        });
        alert('SOS Alert Sent! Help is on the way.');
      } catch (e) {
        console.error("SOS Error:", e);
        alert('Failed to send SOS. Please call supervisor directly.');
      }
    }
  };

  return (
    <Layout role="worker">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle size={24} />
            <div>
                <h4 className="font-bold">Attendance Updated</h4>
                <p className="text-sm">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 hover:bg-green-700 p-1 rounded-full"><X size={16} /></button>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                {user?.name?.[0] || 'U'}
             </div>
             <div>
                 <h1 className="text-xl font-bold text-slate-800 dark:text-white">Hello, {user?.name}</h1>
                 <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                    <UserCheck size={12} /> ID: {user?._id?.substring(0,8)}... <span className="text-slate-300 dark:text-slate-600">|</span> <HardHat size={12} /> Device: {myDevice?.deviceId || 'None'}
                 </p>
             </div>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Current Shift</p>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium text-sm">
                   <Calendar size={14} className="text-blue-500" />
                   {format(new Date(), 'EEEE, d MMM')}
                </div>
             </div>
             <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 ${status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {status.toUpperCase()}
             </div>
          </div>
        </div>

        {/* Top Grid: Status & Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <HelmetStatusCard 
                isConnected={status === 'online'} 
                isWorn={data?.helmetOn ?? false}
                alert={data?.alert}
                lastSync={new Date()}
                signalStrength={data?.signal ?? 85}
            />
            {/* Extended Sensor Metrics Card */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm">Environment & Device</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Humidity</div>
                        <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{data?.humidity ?? '--'}%</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Gas Level</div>
                        <div className="font-bold text-lg text-orange-600 dark:text-orange-400">{data?.gasLevel ?? '--'}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Acceleration</div>
                        <div className="font-bold text-lg text-purple-600 dark:text-purple-400">{data?.accel?.total?.toFixed(1) ?? '--'} m/s²</div>
                    </div>
                     <div className={`p-2 rounded-xl ${data?.alert ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <div className="text-xs text-slate-500 dark:text-slate-400">LED Status</div>
                        <div className={`font-bold text-lg ${data?.alert ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {data?.alert ? 'ON' : 'OFF'}
                        </div>
                    </div>
                </div>
            </div>

            <VitalsTrendChart 
                data={vitalsHistory.filter(v => v.type === 'heartRate').map(v => ({ time: v.time, value: v.value }))}
                type="heartRate"
                currentValue={data?.heartRate || 0}
            />
            <VitalsTrendChart 
                data={vitalsHistory.filter(v => v.type === 'temperature').map(v => ({ time: v.time, value: v.value }))}
                type="temperature"
                currentValue={data?.temperature || 0}
            />
        </div>

        {/* Middle Grid: Map, Alerts, Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
            <GeoLocationCard 
                    position={[data?.lat || 19.0760, data?.lng || 72.8777]}
                    safeZoneCenter={[19.0760, 72.8777]}
                    safeZoneRadius={500}
                    lastUpdate={new Date()}
                />
                {/* Live Coordinates Display */}
                <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                     <div>
                        <div className="text-xs text-slate-500">Latitude</div>
                        <div className="font-mono font-bold">{data?.lat?.toFixed(6) ?? '--'}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-500">Longitude</div>
                        <div className="font-mono font-bold">{data?.lng?.toFixed(6) ?? '--'}</div>
                     </div>
                </div>
                
                {/* DPR Form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Daily Progress Report
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Log your work and request materials.</p>
                        </div>
                        
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Task Description</label>
                                <textarea
                                    value={task}
                                    onChange={(e) => setTask(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all placeholder:text-slate-400 resize-none"
                                    rows={4}
                                    placeholder="Describe your completed tasks in detail..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Site Photo</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-300 transition-all group cursor-pointer relative overflow-hidden bg-slate-50/30">
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    
                                    {imagePreview ? (
                                        <div className="relative z-0">
                                            <img src={imagePreview} alt="Preview" className="mx-auto rounded-lg max-h-40 object-cover shadow-sm ring-4 ring-white dark:ring-slate-700" />
                                            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white cursor-pointer hover:bg-red-500 transition-colors" onClick={(e) => { e.preventDefault(); setImagePreview(''); setImageFile(null); }}>
                                                <Trash2 size={12} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-1">
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                                                <Upload size={20} strokeWidth={1.5} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Evidence</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 h-full flex flex-col">
                             <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Material Requests</label>
                                <button 
                                    onClick={handleAddMaterialRow} 
                                    className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-bold shadow-sm"
                                >
                                    <Plus size={12} strokeWidth={3} /> Add Item
                                </button>
                             </div>
                             
                             <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[120px]">
                                {materials.map((m, i) => (
                                  <div key={i} className="flex gap-2 items-center group bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex-1">
                                        <input 
                                            value={m.name} 
                                            onChange={(e) => handleMaterialChange(i, 'name', e.target.value)} 
                                            placeholder="Item Name" 
                                            className="w-full bg-transparent border-none p-1.5 text-xs focus:outline-none font-medium dark:text-white placeholder:text-slate-400" 
                                        />
                                    </div>
                                    <div className="w-px h-5 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="w-16">
                                        <input 
                                            type="number" 
                                            value={m.quantity} 
                                            onChange={(e) => handleMaterialChange(i, 'quantity', e.target.value)} 
                                            placeholder="Qty" 
                                            className="w-full bg-transparent border-none p-1.5 text-xs focus:outline-none font-bold text-center dark:text-white" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveMaterial(i)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                                {materials.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                                            <Plus size={16} className="text-slate-400" />
                                        </div>
                                        <p className="text-slate-400 text-[10px] font-medium">No materials requested</p>
                                    </div>
                                )}
                             </div>
                             
                             <button 
                                onClick={handleSubmitReport} 
                                disabled={!task && materials.length === 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all mt-auto flex items-center justify-center gap-2 text-sm"
                             >
                                <Upload size={16} strokeWidth={2.5} /> Submit Report
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-4">
                <EmergencyCard onSOS={handleSOS} />
                <AIInsightsCard insights={getInsights()} />
                <SafetyAlertsPanel alerts={alerts} />
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Materials Status</h4>
                  {materialsList.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No recent material requests</p>
                  ) : (
                    <div className="space-y-2">
                      {materialsList.map((m) => (
                        <div key={m._id} className="flex justify-between items-center text-xs p-2 rounded border border-slate-100 dark:border-slate-700">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{m.name} × {m.quantity}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            m.status === 'approved' ? 'bg-green-100 text-green-700' :
                            m.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{m.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ShiftTimeline />
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerDashboard;
