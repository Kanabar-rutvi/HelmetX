import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Plus, Trash2, Edit, QrCode } from 'lucide-react';
import Modal from '../components/Modal';
import QRCode from 'react-qr-code';

const AdminDevices = () => {
  type DeviceItem = { _id: string; deviceId: string; assignedUser?: { _id?: string; name?: string } | string; isActive?: boolean };
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceData, setDeviceData] = useState({ deviceId: '', assignedUser: '' });
  const [qrData, setQrData] = useState<{ title: string; value: string } | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const devicesData = await api.get<DeviceItem[]>('/devices');
      setDevices((devicesData.data || []) as DeviceItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchDevices(); }, 0);
    return () => clearTimeout(t);
  }, [fetchDevices]);

  const openAddDevice = () => {
    setEditingId(null);
    setDeviceData({ deviceId: '', assignedUser: '' });
    setIsDeviceModalOpen(true);
  };

  const openEditDevice = (device: DeviceItem) => {
    setEditingId(device._id);
    setDeviceData({ 
      deviceId: device.deviceId, 
      assignedUser: typeof device.assignedUser === 'object' ? (device.assignedUser?._id || '') : (device.assignedUser || '') 
    });
    setIsDeviceModalOpen(true);
  };

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/devices/${editingId}`, deviceData);
      } else {
        await api.post('/devices', deviceData);
      }
      setIsDeviceModalOpen(false);
      fetchDevices();
    } catch (error) {
      console.error(error);
      alert('Error saving device');
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/devices/${id}`);
      fetchDevices();
    } catch (error) {
      console.error(error);
      alert('Error deleting device');
    }
  };

  const handleGenerateHelmetQR = (device: DeviceItem) => {
    const payload = {
        type: 'HELMET',
        id: device.deviceId,
        action: 'SCAN'
    };
    setQrData({
        title: `Helmet: ${device.deviceId}`,
        value: JSON.stringify(payload)
    });
    setIsQrModalOpen(true);
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Device Management</h2>
        <button onClick={openAddDevice} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Device ID</th>
              <th className="p-3 text-left">Assigned User</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device._id} className="border-t">
                <td className="p-3">{device.deviceId}</td>
                <td className="p-3">
                  {typeof device.assignedUser === 'object' 
                    ? (device.assignedUser?.name || 'Unassigned') 
                    : (device.assignedUser || 'Unassigned')}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${device.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleGenerateHelmetQR(device)} className="text-purple-600 hover:bg-purple-50 p-1 rounded" title="Generate QR">
                    <QrCode size={18} />
                  </button>
                  <button onClick={() => openEditDevice(device)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18} /></button>
                  <button onClick={() => deleteDevice(device._id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title={editingId ? 'Edit Device' : 'Add Device'}>
        <form onSubmit={handleDeviceSubmit} className="space-y-4">
          <input type="text" placeholder="Device ID (ESP32 MAC or Serial)" className="w-full p-2 border rounded" value={deviceData.deviceId} onChange={e => setDeviceData({...deviceData, deviceId: e.target.value})} required />
          <input type="text" placeholder="Assigned User ID (Optional)" className="w-full p-2 border rounded" value={deviceData.assignedUser} onChange={e => setDeviceData({...deviceData, assignedUser: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
        </form>
      </Modal>

      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Helmet QR Code">
        {qrData && (
            <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white border rounded-xl shadow-sm">
                    <QRCode value={qrData.value} size={256} />
                </div>
                <div className="text-center">
                    <p className="font-bold text-lg">{qrData.title}</p>
                    <p className="text-sm text-gray-500">Scan this code to manage attendance</p>
                </div>
            </div>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminDevices;
