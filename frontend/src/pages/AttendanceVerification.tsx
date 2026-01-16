import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Scan, X, Calendar, CheckCircle, Clock, AlertTriangle, User, Search } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  user: { name: string; role: string; assignedSite: string } | string;
  deviceId: string;
  checkInTime: string;
  checkOutTime?: string;
  verified: boolean;
  status: string;
  duration?: number;
}

interface AttendanceOverview {
  date: string;
  total: number;
  present: number;
  late: number;
  checkedOut: number;
  absent: number;
}

const AttendanceVerification = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [processingScan, setProcessingScan] = useState(false);
  const scannerRef = useRef<any | null>(null);
  const [preScanHelmetId, setPreScanHelmetId] = useState<string | null>(null);
  const [preScanWorkerName, setPreScanWorkerName] = useState<string | null>(null);
  const jobRoles = ['welding','carpenter','mason','electrician','plumber','painter','steel_fixer','scaffolder','operator'];
  const [jobRole, setJobRole] = useState<string>(jobRoles[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, overviewRes] = await Promise.all([
        api.get<AttendanceRecord[]>(`/attendance?date=${date}`),
        api.get<any>(`/attendance/overview?date=${date}`)
      ]);
      setRecords(listRes.data || []);
      setOverview(overviewRes.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  // Scanner Effect
  useEffect(() => {
    let active = true;
    const initScanner = async () => {
      if (scanModalOpen && !scanResult) {
        const mod: any = await import('html5-qrcode');
        const Html5QrcodeScanner = mod.Html5QrcodeScanner;
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scanner.render(async (decodedText: string) => {
          scanner.clear();
          setProcessingScan(true);
          try {
            const res = await api.post('/attendance/scan-qr', { qrPayload: decodedText });
            if (!active) return;
            setScanResult(res.data);
          } catch (error: any) {
            alert(error.response?.data?.message || 'Invalid Scan');
            setScanModalOpen(false);
          } finally {
            setProcessingScan(false);
          }
        }, (_error: any) => {});
        scannerRef.current = scanner;
      }
    };
    initScanner();
    return () => {
      active = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanModalOpen, scanResult]);

  const handleApproveScan = async () => {
    if (!scanResult) return;
    try {
      await api.post('/attendance/approve', {
        workerId: scanResult.worker.id,
        helmetId: scanResult.helmetId,
        action: scanResult.action,
        attendanceId: scanResult.attendanceId,
        jobRole
      });
      setScanModalOpen(false);
      setScanResult(null);
      loadData();
      alert(`Attendance ${scanResult.action === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} Approved`);
    } catch (error) {
      console.error(error);
      alert('Failed to approve attendance');
    }
  };

  return (
    <Layout role="supervisor">
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Verification</h1>
                <p className="text-sm text-gray-500 mt-1">Manage worker check-ins and verify records</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                    />
                </div>
                <button 
                    onClick={() => { setScanResult(null); setScanModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 font-bold text-sm whitespace-nowrap"
                >
                    <Scan size={18} /> Scan Worker QR
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Workers</div>
              <div className="text-2xl font-bold text-gray-800">{overview?.total || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Present</div>
              <div className="text-2xl font-bold text-green-600">{overview?.present || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</div>
              <div className="text-2xl font-bold text-orange-500">{overview?.checkedOut || 0}</div> {/* Using CheckedOut count as placeholder or need new stat */}
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</div>
              <div className="text-lg font-bold text-blue-600">{new Date(date).toLocaleDateString()}</div>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-800">Attendance Log</h3>
             <div className="text-xs text-gray-400">Showing records for {date}</div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-4">Worker</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Check In</th>
                          <th className="px-6 py-4">Check Out</th>
                          <th className="px-6 py-4">Duration</th>
                          <th className="px-6 py-4">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading records...</td></tr>
                    ) : records.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">No attendance records found for this date.</td></tr>
                    ) : records.map(rec => (
                      <tr key={rec._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    {rec.user && typeof rec.user === 'object' && (rec.user as any).name ? (rec.user as any).name.charAt(0) : 'U'}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{rec.user && typeof rec.user === 'object' && (rec.user as any).name ? (rec.user as any).name : 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{rec.user && typeof rec.user === 'object' && (rec.user as any).role ? (rec.user as any).role : ''}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                rec.status === 'checked_out' ? 'bg-gray-100 text-gray-600' : 
                                rec.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    rec.status === 'present' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                }`}></span>
                                {rec.status === 'checked_out' ? 'Completed' : 'On Site'}
                            </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600">{new Date(rec.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-6 py-4 font-mono text-gray-600">{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                        <td className="px-6 py-4 text-gray-500">{rec.duration ? `${Math.floor(rec.duration/60)}h ${rec.duration%60}m` : '-'}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              {!rec.verified && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.put(`/attendance/${rec._id}/verify`);
                                      setRecords(prev => prev.map(r => r._id === rec._id ? { ...r, verified: true } : r));
                                      loadData();
                                    } catch (e) {}
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const ok = window.confirm('Delete this attendance record?');
                                  if (!ok) return;
                                  try {
                                    await api.delete(`/attendance/${rec._id}`);
                                    setRecords(prev => prev.filter(r => r._id !== rec._id));
                                    loadData();
                                  } catch (e: any) {
                                    alert(e?.response?.data?.message || 'Failed to delete');
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => {
                                  const name = rec.user && typeof rec.user === 'object' && (rec.user as any).name ? (rec.user as any).name : null;
                                  setPreScanHelmetId(rec.deviceId || null);
                                  setPreScanWorkerName(name);
                                  setScanResult(null);
                                  setScanModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                              >
                                Scan Again
                              </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
              </table>
          </div>
        </div>

        {/* Scan Modal */}
        {scanModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Scan className="text-blue-600" />
                            {scanResult ? 'Confirm Attendance' : 'Scan QR Code'}
                        </h3>
                        <button onClick={() => setScanModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {!scanResult ? (
                            <div className="space-y-4">
                                {preScanWorkerName || preScanHelmetId ? (
                                  <div className="text-sm text-gray-600">
                                    {preScanWorkerName ? `Worker: ${preScanWorkerName}` : ''} {preScanWorkerName && preScanHelmetId ? '•' : ''} {preScanHelmetId ? `Helmet ID: ${preScanHelmetId}` : ''}
                                  </div>
                                ) : null}
                                <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-gray-200"></div>
                                <p className="text-center text-sm text-gray-500">Position the worker's helmet QR code within the frame.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className={`p-4 rounded-xl border ${scanResult.action === 'CHECK_IN' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <div className="text-center">
                                        <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${scanResult.action === 'CHECK_IN' ? 'text-green-600' : 'text-orange-600'}`}>
                                            Action Required
                                        </div>
                                        <div className="text-2xl font-bold text-gray-800">
                                            {scanResult.action === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-500">Worker</span>
                                        <span className="text-sm font-bold text-gray-800">{scanResult.worker.name}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-500">Role</span>
                                        {scanResult.action === 'CHECK_IN' ? (
                                          <select
                                            value={jobRole}
                                            onChange={(e) => setJobRole(e.target.value)}
                                            className="text-sm font-bold text-gray-800 border border-gray-200 rounded-lg px-2 py-1"
                                          >
                                            {jobRoles.map((r) => (
                                              <option key={r} value={r}>
                                                {r.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                                              </option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-800">{scanResult.worker.role}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-500">Shift</span>
                                        <span className="text-sm font-bold text-gray-800">{scanResult.shift.name} ({scanResult.shift.startTime} - {scanResult.shift.endTime})</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleApproveScan}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                                        scanResult.action === 'CHECK_IN' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30'
                                    }`}
                                >
                                    Approve & {scanResult.action === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceVerification;
