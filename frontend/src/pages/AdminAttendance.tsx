import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Plus, Trash2, Edit, CheckCircle, LogOut, AlertTriangle, Filter, Search } from 'lucide-react';
import Modal from '../components/Modal';
import QRCode from 'react-qr-code';

const AdminAttendance = () => {
 const [activeTab, setActiveTab] = useState<'shifts' | 'logs' | 'scans' | 'audit'>('shifts');
  type ShiftItem = { _id: string; name: string; startTime: string; endTime: string; gracePeriod: number };
  type AttendanceLogItem = { _id: string; user?: { name?: string; email?: string }; date?: string; checkInTime?: string; checkOutTime?: string; status: 'present' | 'late' | 'absent' | 'checked_out'; verified?: boolean; source?: string; duration?: number };
  type AuditLogItem = { _id: string; actor?: { name?: string; email?: string }; action: string; targetType: string; targetId?: string; details?: string; createdAt: string; metadata?: any };
  type ScanLogItem = { _id: string; helmetId: string; scanType: 'IN' | 'OUT'; timestamp: string; location?: { lat: number; lng: number }; status: 'valid' | 'invalid' | 'geo_fail' | 'duplicate'; failReason?: string; workerId?: { name: string }; siteId?: { name: string } };
  type SiteItem = { _id: string; name: string; location: { coordinates: number[] } };

  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLogItem[]>([]);
  const [sites, setSites] = useState<SiteItem[]>([]);

  // Filters
  const [filters, setFilters] = useState({ siteId: '', date: '', helmetId: '' });
  
  // Modal State
  const [modalType, setModalType] = useState<'shift' | 'attendance' | 'qr' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{title: string, value: string} | null>(null);
  
  // Form Data
  const [shiftData, setShiftData] = useState({ name: '', startTime: '', endTime: '', gracePeriod: 15 });
  const [attendanceData, setAttendanceData] = useState({ checkInTime: '', checkOutTime: '', status: '' });

  const printQR = () => {
    const printContent = document.getElementById('printable-qr');
    const win = window.open('', '', 'width=600,height=600');
    if (win && printContent) {
        win.document.write(`<html><head><title>Print QR</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;">${printContent.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    }
  };

  const fetchShifts = useCallback(async () => {
    try {
      const res = await api.get<ShiftItem[]>('/shifts');
      setShifts((res.data || []) as ShiftItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get<AttendanceLogItem[]>('/attendance');
      setLogs((res.data || []) as AttendanceLogItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.get<AuditLogItem[]>('/attendance/audit');
      setAuditLogs((res.data || []) as AuditLogItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchSites = useCallback(async () => {
    try {
      const res = await api.get<SiteItem[]>('/sites');
      setSites((res.data || []) as SiteItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchScanLogs = useCallback(async () => {
    try {
        const params = new URLSearchParams();
        if (filters.siteId) params.append('siteId', filters.siteId);
        if (filters.date) params.append('date', filters.date);
        if (filters.helmetId) params.append('helmetId', filters.helmetId);

        const res = await api.get<ScanLogItem[]>(`/attendance/scans?${params.toString()}`);
        setScanLogs((res.data || []) as ScanLogItem[]);
    } catch (error) {
        console.error(error);
    }
  }, [filters]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    const t = setTimeout(() => { 
        if (activeTab === 'shifts') fetchShifts(); 
        else if (activeTab === 'logs') fetchLogs();
        else if (activeTab === 'scans') fetchScanLogs();
        else fetchAuditLogs();
    }, 0);
    return () => clearTimeout(t);
  }, [activeTab, fetchShifts, fetchLogs, fetchAuditLogs, fetchScanLogs]);

  // --- Shift Handlers ---
  const openAddShift = () => {
    setEditingId(null);
    setShiftData({ name: '', startTime: '', endTime: '', gracePeriod: 15 });
    setModalType('shift');
  };

  const openEditShift = (shift: ShiftItem) => {
    setEditingId(shift._id);
    setShiftData({ 
      name: shift.name, 
      startTime: shift.startTime, 
      endTime: shift.endTime, 
      gracePeriod: shift.gracePeriod 
    });
    setModalType('shift');
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/shifts/${editingId}`, shiftData);
      } else {
        await api.post('/shifts', shiftData);
      }
      setModalType(null);
      fetchShifts();
    } catch (error) {
      console.error(error);
      alert('Error saving shift');
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/shifts/${id}`);
      fetchShifts();
    } catch (error) {
      console.error(error);
      alert('Error deleting shift');
    }
  };

  // --- Attendance Handlers ---
  const openEditAttendance = (log: AttendanceLogItem) => {
    setEditingId(log._id);
    setAttendanceData({
      checkInTime: log.checkInTime ? new Date(log.checkInTime).toISOString().slice(0, 16) : '',
      checkOutTime: log.checkOutTime ? new Date(log.checkOutTime).toISOString().slice(0, 16) : '',
      status: log.status
    });
    setModalType('attendance');
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/attendance/${editingId}`, attendanceData);
      setModalType(null);
      fetchLogs();
    } catch (error) {
      console.error(error);
      alert('Error updating attendance');
    }
  };

  const handleForceCheckout = async (id: string) => {
    if (!confirm('Force checkout this user?')) return;
    try {
      await api.put(`/attendance/${id}`, { checkOutTime: new Date().toISOString() });
      fetchLogs();
    } catch (error) {
      console.error(error);
      alert('Error forcing checkout');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.put(`/attendance/${id}/verify`, {});
      fetchLogs();
    } catch (error) {
      console.error(error);
      alert('Error verifying record');
    }
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Management</h2>
        {activeTab === 'shifts' && (
          <button onClick={openAddShift} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Plus size={18} /> Add Shift
          </button>
        )}
      </div>

      {/* Filters */}
      {(activeTab === 'logs' || activeTab === 'scans') && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="font-semibold text-gray-700">Filters:</span>
            </div>
            <select 
                className="border rounded p-2 text-sm"
                value={filters.siteId}
                onChange={e => setFilters({...filters, siteId: e.target.value})}
            >
                <option value="">All Sites</option>
                {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input 
                type="date" 
                className="border rounded p-2 text-sm"
                value={filters.date}
                onChange={e => setFilters({...filters, date: e.target.value})}
            />
            {activeTab === 'scans' && (
                <div className="flex items-center gap-2 border rounded p-2 bg-white">
                    <Search size={16} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search Helmet ID" 
                        className="text-sm outline-none"
                        value={filters.helmetId}
                        onChange={e => setFilters({...filters, helmetId: e.target.value})}
                    />
                </div>
            )}
            {(filters.siteId || filters.date || filters.helmetId) && (
                <button 
                    onClick={() => setFilters({ siteId: '', date: '', helmetId: '' })}
                    className="text-sm text-red-600 hover:underline"
                >
                    Clear Filters
                </button>
            )}
        </div>
      )}

      <div className="mb-6 flex gap-4 border-b">
        <button 
          className={`pb-2 px-4 ${activeTab === 'shifts' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('shifts')}
        >
          Shift Rules
        </button>
        <button 
          className={`pb-2 px-4 ${activeTab === 'logs' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('logs')}
        >
          Attendance Records
        </button>
        <button 
          className={`pb-2 px-4 ${activeTab === 'scans' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('scans')}
        >
          Scan History
        </button>
        <button 
          className={`pb-2 px-4 ${activeTab === 'audit' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Trail
        </button>
      </div>

      {activeTab === 'shifts' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Shift Name</th>
              <th className="p-3 text-left">Start Time</th>
              <th className="p-3 text-left">End Time</th>
              <th className="p-3 text-left">Grace Period (min)</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift._id} className="border-t">
                <td className="p-3">{shift.name}</td>
                <td className="p-3">{shift.startTime}</td>
                <td className="p-3">{shift.endTime}</td>
                <td className="p-3">{shift.gracePeriod}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEditShift(shift)} className="text-blue-600"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteShift(shift._id)} className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : activeTab === 'logs' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Check In</th>
                <th className="p-3 text-left">Check Out</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Verified</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="p-3">
                    <div>{log.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{log.user?.email}</div>
                  </td>
                  <td className="p-3">{log.date ? new Date(log.date).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : '-'}</td>
                  <td className="p-3">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '-'}</td>
                  <td className="p-3 font-mono">
                      {log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.status === 'present' ? 'bg-blue-100 text-blue-800' : 
                      log.status === 'checked_out' ? 'bg-green-100 text-green-800' :
                      log.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{log.source || 'AUTO'}</td>
                  <td className="p-3">
                    {log.verified ? <CheckCircle size={16} className="text-green-500" /> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEditAttendance(log)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Edit">
                        <Edit size={16} />
                    </button>
                    {!log.checkOutTime && (
                        <button onClick={() => handleForceCheckout(log._id)} className="text-orange-600 hover:bg-orange-50 p-1 rounded" title="Force Checkout">
                            <LogOut size={16} />
                        </button>
                    )}
                    {!log.verified && (
                        <button onClick={() => handleVerify(log._id)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Verify">
                            <CheckCircle size={16} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'scans' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Helmet ID</th>
                <th className="p-3 text-left">Worker</th>
                <th className="p-3 text-left">Site</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {scanLogs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="p-3 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.scanType === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                        {log.scanType}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">{log.helmetId}</td>
                  <td className="p-3">
                      <div className="font-medium">{log.workerId?.name || '-'}</div>
                  </td>
                  <td className="p-3 text-sm">{log.siteId?.name || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.status === 'valid' ? 'bg-green-100 text-green-700' : 
                      log.status === 'geo_fail' ? 'bg-red-100 text-red-700' : 
                      log.status === 'duplicate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.status === 'geo_fail' ? 'GEO FENCE' : log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-red-600">
                      {log.failReason}
                  </td>
                </tr>
              ))}
              {scanLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">No scan logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Actor</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Target</th>
                <th className="p-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="p-3 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="font-medium">{log.actor?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{log.actor?.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700">
                        {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{log.targetType} ({log.targetId})</td>
                  <td className="p-3 text-sm">{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Shift */}
      <Modal isOpen={modalType === 'shift'} onClose={() => setModalType(null)} title={editingId ? 'Edit Shift' : 'Add Shift'}>
        <form onSubmit={handleShiftSubmit} className="space-y-4">
          <input type="text" placeholder="Shift Name" className="w-full p-2 border rounded" value={shiftData.name} onChange={e => setShiftData({...shiftData, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm">Start Time</label>
              <input type="time" className="w-full p-2 border rounded" value={shiftData.startTime} onChange={e => setShiftData({...shiftData, startTime: e.target.value})} required />
            </div>
            <div>
              <label className="text-sm">End Time</label>
              <input type="time" className="w-full p-2 border rounded" value={shiftData.endTime} onChange={e => setShiftData({...shiftData, endTime: e.target.value})} required />
            </div>
          </div>
          <div>
              <label className="text-sm">Grace Period (minutes)</label>
              <input type="number" className="w-full p-2 border rounded" value={shiftData.gracePeriod} onChange={e => setShiftData({...shiftData, gracePeriod: Number(e.target.value)})} required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
        </form>
      </Modal>

      {/* Modal for Attendance Edit */}
      <Modal isOpen={modalType === 'attendance'} onClose={() => setModalType(null)} title="Edit Attendance Record">
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
            <div>
                <label className="text-sm block mb-1">Check In Time</label>
                <input 
                    type="datetime-local" 
                    className="w-full p-2 border rounded" 
                    value={attendanceData.checkInTime} 
                    onChange={e => setAttendanceData({...attendanceData, checkInTime: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-sm block mb-1">Check Out Time</label>
                <input 
                    type="datetime-local" 
                    className="w-full p-2 border rounded" 
                    value={attendanceData.checkOutTime} 
                    onChange={e => setAttendanceData({...attendanceData, checkOutTime: e.target.value})} 
                />
            </div>
            <div>
                <label className="text-sm block mb-1">Status</label>
                <select 
                    className="w-full p-2 border rounded"
                    value={attendanceData.status}
                    onChange={e => setAttendanceData({...attendanceData, status: e.target.value})}
                >
                    <option value="present">Present (On Site)</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                </select>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5" />
                <p>Modifying this record will create an audit log entry. Ensure all changes are verified.</p>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Update Record</button>
        </form>
      </Modal>
      <Modal isOpen={modalType === 'qr'} onClose={() => setModalType(null)} title="Print QR Code">
        <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-bold mb-4 text-center">{qrData?.title}</h3>
            <div id="printable-qr" className="bg-white p-4">
                <QRCode value={qrData?.value || ''} size={256} />
            </div>
            <div className="mt-6 flex gap-3 w-full">
                <button 
                    onClick={printQR}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Print QR Code
                </button>
                <button 
                    onClick={() => setModalType(null)}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminAttendance;
