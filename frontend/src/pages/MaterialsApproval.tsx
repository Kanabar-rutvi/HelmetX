import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const MaterialsApproval = () => {
  type PendingItem = { _id: string; name: string; quantity: number; note?: string; status: string; date: string; user?: { name?: string }; reportId: string };
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [role, setRole] = useState<string>('supervisor');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/materials/pending', { params: { siteId: selectedSite || undefined } });
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => { 
    (async () => {
      try {
        const prof = await api.get('/auth/me');
        setRole(prof.data?.role || 'supervisor');
        if (prof.data?.role === 'admin') {
          const s = await api.get('/sites');
          setSites((s.data || []) as Array<{ _id: string; name: string }>);
        }
      } catch (e) { console.error(e); }
      await loadData();
    })();
  }, [loadData]);
  
  useEffect(() => { if (role === 'admin') loadData(); }, [selectedSite, role, loadData]);

  return (
    <Layout role={role === 'admin' ? 'admin' : 'supervisor'}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Materials Approval</h1>

        {role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter by Site</span>
            <select 
              value={selectedSite} 
              onChange={(e) => setSelectedSite(e.target.value)} 
              className="border px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 font-semibold">Pending Materials</div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-gray-500">No pending materials</div>
            ) : items.map((m) => (
              <div key={m._id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold">{m.name}</div>
                  <div className="text-sm text-gray-600">Qty: {m.quantity}</div>
                  <div className="text-xs text-gray-500">{m.date}</div>
                  <div className="text-xs text-gray-500">{m.user?.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/reports/materials/${m.reportId}/${m._id}/status`, { status: 'approved' });
                        setItems(prev => prev.filter(i => i._id !== m._id));
                        window.dispatchEvent(new CustomEvent('materials-updated'));
                      } catch (e) { console.error(e); }
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/reports/materials/${m.reportId}/${m._id}/status`, { status: 'rejected' });
                        setItems(prev => prev.filter(i => i._id !== m._id));
                        window.dispatchEvent(new CustomEvent('materials-updated'));
                      } catch (e) { console.error(e); }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialsApproval;
