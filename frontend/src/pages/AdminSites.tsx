import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Plus } from 'lucide-react';
import Modal from '../components/Modal';

const AdminSites = () => {
  type SiteItem = { _id: string; name: string; description?: string; geofenceRadius: number; location: { coordinates: [number, number] }; supervisors?: Array<{ _id: string; name: string } | string>; workers?: Array<{ _id: string; name: string } | string> };
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [siteData, setSiteData] = useState({ 
    name: '', 
    description: '', 
    lat: '', 
    lng: '', 
    geofenceRadius: 100,
    supervisors: [] as string[],
    workers: [] as string[]
  });
  type UserItem = { _id: string; name: string };
  const [availableSupervisors, setAvailableSupervisors] = useState<UserItem[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<UserItem[]>([]);

  const fetchSites = useCallback(async () => {
    try {
      const res = await api.get<SiteItem[]>('/sites');
      setSites((res.data || []) as SiteItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const [supRes, workRes] = await Promise.all([
        api.get<UserItem[]>('/users?role=supervisor'),
        api.get<UserItem[]>('/users?role=worker')
      ]);
      setAvailableSupervisors((supRes.data || []) as UserItem[]);
      setAvailableWorkers((workRes.data || []) as UserItem[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchSites(); fetchUsers(); }, 0);
    return () => clearTimeout(t);
  }, [fetchSites, fetchUsers]);

  const openAdd = () => {
    setEditingId(null);
    setSiteData({ 
      name: '', 
      description: '', 
      lat: '', 
      lng: '', 
      geofenceRadius: 100,
      supervisors: [],
      workers: []
    });
    setIsModalOpen(true);
  };

  const openEdit = (site: SiteItem) => {
    setEditingId(site._id);
    setSiteData({ 
      name: site.name, 
      description: site.description || '', 
      lat: String(site.location.coordinates[1]), 
      lng: String(site.location.coordinates[0]), 
      geofenceRadius: site.geofenceRadius,
      supervisors: site.supervisors ? site.supervisors.map((s) => typeof s === 'string' ? s : s._id) : [],
      workers: site.workers ? site.workers.map((w) => typeof w === 'string' ? w : w._id) : []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: siteData.name,
        description: siteData.description,
        location: { type: 'Point', coordinates: [Number(siteData.lng), Number(siteData.lat)] },
        geofenceRadius: Number(siteData.geofenceRadius),
        supervisors: siteData.supervisors,
        workers: siteData.workers
      };

      if (editingId) {
        await api.put(`/sites/${editingId}`, payload);
      } else {
        await api.post('/sites', payload);
      }
      setIsModalOpen(false);
      fetchSites();
    } catch (error) {
      console.error(error);
      alert('Error saving site');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/sites/${id}`);
      fetchSites();
    } catch (error) {
      console.error(error);
      alert('Error deleting site');
    }
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Site & Geo-fencing</h2>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Add Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div key={site._id} className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-bold">{site.name}</h3>
            <p className="text-gray-600">{site.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              <p>Lat: {site.location.coordinates[1]}</p>
              <p>Lng: {site.location.coordinates[0]}</p>
              <p>Radius: {site.geofenceRadius}m</p>
            </div>
            
            <div className="mt-3 border-t pt-2">
                <p className="text-sm font-semibold">Supervisors ({site.supervisors?.length || 0})</p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {((site.supervisors ?? []).length > 0) ? (
                        (site.supervisors ?? []).map((s) => (
                            <span key={typeof s === 'string' ? s : s._id} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                {typeof s === 'string' ? s : s.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-xs">None assigned</span>
                    )}
                </div>
            </div>

            <div className="mt-2">
                <p className="text-sm font-semibold">Workers ({site.workers?.length || 0})</p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {((site.workers ?? []).length > 0) ? (
                        (site.workers ?? []).map((w) => (
                            <span key={typeof w === 'string' ? w : w._id} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                {typeof w === 'string' ? w : w.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-xs">None assigned</span>
                    )}
                </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(site)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded">Edit</button>
              <button onClick={() => handleDelete(site._id)} className="bg-red-100 text-red-600 px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Site' : 'Add Site'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Site Name" className="w-full p-2 border rounded" value={siteData.name} onChange={e => setSiteData({...siteData, name: e.target.value})} required />
          <textarea placeholder="Description" className="w-full p-2 border rounded" value={siteData.description} onChange={e => setSiteData({...siteData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
             <input type="number" step="any" placeholder="Latitude" className="w-full p-2 border rounded" value={siteData.lat} onChange={e => setSiteData({...siteData, lat: e.target.value})} required />
             <input type="number" step="any" placeholder="Longitude" className="w-full p-2 border rounded" value={siteData.lng} onChange={e => setSiteData({...siteData, lng: e.target.value})} required />
          </div>
          <input type="number" placeholder="Geofence Radius (meters)" className="w-full p-2 border rounded" value={siteData.geofenceRadius} onChange={e => setSiteData({...siteData, geofenceRadius: Number(e.target.value)})} required />
          
          <div>
            <label className="block text-sm font-medium mb-1">Assign Supervisors</label>
            <div className="border rounded p-2 max-h-32 overflow-y-auto">
                {availableSupervisors.length === 0 && <p className="text-gray-500 text-sm">No supervisors available</p>}
                {availableSupervisors.map(user => (
                    <label key={user._id} className="flex items-center space-x-2 mb-1">
                        <input 
                            type="checkbox" 
                            checked={siteData.supervisors.includes(user._id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSiteData({...siteData, supervisors: [...siteData.supervisors, user._id]});
                                } else {
                                    setSiteData({...siteData, supervisors: siteData.supervisors.filter(id => id !== user._id)});
                                }
                            }}
                        />
                        <span className="text-sm">{user.name}</span>
                    </label>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign Workers</label>
            <div className="border rounded p-2 max-h-32 overflow-y-auto">
                {availableWorkers.length === 0 && <p className="text-gray-500 text-sm">No workers available</p>}
                {availableWorkers.map(user => (
                    <label key={user._id} className="flex items-center space-x-2 mb-1">
                        <input 
                            type="checkbox" 
                            checked={siteData.workers.includes(user._id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSiteData({...siteData, workers: [...siteData.workers, user._id]});
                                } else {
                                    setSiteData({...siteData, workers: siteData.workers.filter(id => id !== user._id)});
                                }
                            }}
                        />
                        <span className="text-sm">{user.name}</span>
                    </label>
                ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default AdminSites;
