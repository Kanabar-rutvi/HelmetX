import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Users, HardHat, ShieldAlert, MapPin, Activity, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import SafetyMonitor from './SafetyMonitor';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fix for default marker icon in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

type DailyReportListItem = {
  _id: string;
  user?: { name?: string };
  imageUrl?: string;
  task: string;
};

type SiteItem = {
  _id: string;
  name: string;
  description?: string;
  geofenceRadius?: number;
  location: { coordinates: [number, number] };
};

type AlertItem = {
  _id: string;
  type: string;
  severity: 'low' | 'medium' | 'critical';
  deviceId: string;
  timestamp: string;
  status?: string;
};

type AttendanceStats = {
  total: number;
  present: number;
  late: number;
  checkedOut: number;
  absent: number;
  avgDuration: number;
};

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    devices: 0,
    sites: 0,
    alerts: 0
  });

  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<DailyReportListItem[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [usersRes, devicesRes, sitesRes, alertsRes, reportsRes, attendanceRes] = await Promise.all([
        api.get<Array<{ _id: string }>>('/users'),
        api.get<Array<{ _id: string }>>('/devices'),
        api.get<SiteItem[]>('/sites'),
        api.get<AlertItem[]>('/data/alerts?limit=5'),
        api.get<DailyReportListItem[]>('/reports/all', { params: { startDate: todayStr, endDate: todayStr } }),
        api.get<AttendanceStats>('/attendance/overview', { params: { date: todayStr } })
      ]);

      const alertsData: AlertItem[] = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      const activeAlerts = alertsData.filter((a) => a.status === 'new').length;

      setStats({
        users: usersRes.data.length,
        devices: devicesRes.data.length,
        sites: sitesRes.data.length,
        alerts: activeAlerts
      });

      setRecentAlerts(alertsData.slice(0, 5));
      setSites((sitesRes.data || []) as SiteItem[]);
      setRecentReports(((reportsRes.data || []) as DailyReportListItem[]).slice(0, 6));
      setAttendanceStats(attendanceRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Default center (e.g., city center or first site)
  const defaultCenter: [number, number] = sites.length > 0 && sites[0]?.location?.coordinates 
    ? [sites[0].location.coordinates[1], sites[0].location.coordinates[0]] 
    : [28.6139, 77.2090]; // New Delhi default

  const chartData = attendanceStats ? [
    { name: 'Present', value: attendanceStats.present, fill: '#10B981' },
    { name: 'Late', value: attendanceStats.late, fill: '#F59E0B' },
    { name: 'Absent', value: attendanceStats.absent, fill: '#EF4444' },
    { name: 'Checked Out', value: attendanceStats.checkedOut, fill: '#3B82F6' },
  ] : [];

  return (
    <Layout role="admin">
      <h2 className="text-2xl font-bold mb-6">System Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Workers</p>
            <h3 className="text-3xl font-bold">{stats.users}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Users size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Devices</p>
            <h3 className="text-3xl font-bold">{stats.devices}</h3>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <HardHat size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Sites</p>
            <h3 className="text-3xl font-bold">{stats.sites}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Alerts</p>
            <h3 className="text-3xl font-bold text-red-600">{stats.alerts}</h3>
          </div>
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* End of Shift Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow h-[400px]">
            <h3 className="text-lg font-bold mb-4">End of Shift Analytics</h3>
            {attendanceStats ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" />
                    </BarChart>
                </ResponsiveContainer>
            ) : <p>Loading stats...</p>}
         </div>
         <div className="bg-white p-6 rounded-lg shadow h-[400px] flex flex-col items-center justify-center">
             <h3 className="text-lg font-bold mb-4 text-center">Avg Shift Duration</h3>
             <div className="w-40 h-40 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Clock size={64} className="text-blue-500" />
             </div>
             <div className="text-4xl font-bold text-gray-800">
                 {attendanceStats ? `${Math.floor(attendanceStats.avgDuration / 60)}h ${attendanceStats.avgDuration % 60}m` : '--'}
             </div>
             <p className="text-gray-500 mt-2">Based on checked-out workers</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Real-time Map */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow h-[500px] flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin size={20} /> Live Site Map
          </h3>
          <div className="flex-1 rounded overflow-hidden z-0">
             {loading ? <div className="h-full flex items-center justify-center">Loading Map...</div> : (
               <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                 <TileLayer
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 />
                 {sites.map(site => (
                   <React.Fragment key={site._id}>
                     <Marker position={[site.location.coordinates[1], site.location.coordinates[0]]}>
                       <Popup>
                         <strong>{site.name}</strong><br/>
                         {site.description}
                       </Popup>
                     </Marker>
                     <Circle 
                        center={[site.location.coordinates[1], site.location.coordinates[0]]}
                        radius={site.geofenceRadius || 100}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                     />
                   </React.Fragment>
                 ))}
               </MapContainer>
             )}
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="bg-white p-6 rounded-lg shadow h-[500px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldAlert size={20} /> Recent Incidents
          </h3>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent alerts</p>
            ) : (
                recentAlerts.map(alert => (
                  <div key={alert._id} className="p-3 bg-gray-50 rounded border-l-4 border-red-500 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800">{alert.type}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        Device: {alert.deviceId} <br/>
                        {new Date(alert.timestamp).toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <button 
                        className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        onClick={() => navigate('/supervisor')}
                      >
                        Open in Supervisor
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Recent DPRs */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <HardHat size={20} /> Today’s DPRs
        </h3>
        {recentReports.length === 0 ? (
          <p className="text-gray-500">No reports submitted today</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentReports.map((r: DailyReportListItem) => {
              const origin =
                api.defaults?.baseURL
                  ? api.defaults.baseURL.replace(/\/api$/, '')
                  : (import.meta as ImportMeta).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
              return (
                <div key={r._id} className="flex items-center gap-3 p-3 rounded border border-gray-100">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                    {r.imageUrl ? (
                      <img src={`${origin}${r.imageUrl}`} alt={r.user?.name || 'Report'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{r.user?.name || 'Worker'}</div>
                    <div className="text-xs text-gray-500 truncate">{r.task}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Safety Monitor */}
      <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={20} /> Live Device Monitor
          </h3>
          <SafetyMonitor embedded={true} role="admin" />
      </div>

    </Layout>
  );
};

export default AdminDashboard;
