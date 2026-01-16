import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Package, CheckCircle2, Clock, Plus } from 'lucide-react';

const RequestMaterials = () => {
  const [stats, setStats] = useState<{ pending: number; approved: number; total: number }>({ pending: 0, approved: 0, total: 0 });
  const [items, setItems] = useState<Array<{ _id: string; name: string; quantity: number; note?: string; date: string; status: string }>>([]);
  const [newItems, setNewItems] = useState<Array<{ name: string; quantity: number; note?: string }>>([]);

  const fetchData = async () => {
    try {
      const s = await api.get('/reports/materials/stats');
      setStats(s.data);
      const l = await api.get('/reports/materials/list');
      setItems(l.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    setTimeout(() => { fetchData(); }, 0);
  }, []);

  const addRow = () => setNewItems(prev => [...prev, { name: '', quantity: 1, note: '' }]);
  const updateRow = (i: number, field: 'name' | 'quantity' | 'note', value: string) => {
    setNewItems(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: field === 'quantity' ? Number(value) : value } : r));
  };
  const submit = async () => {
    try {
      await api.post('/reports/materials', { items: newItems.filter(n => n.name && n.quantity) });
      setNewItems([]);
      await fetchData();
      alert('Request submitted');
    } catch { alert('Failed to submit'); }
  };

  return (
    <Layout role="worker">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Material Requests</h1>
          <button onClick={addRow} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> New Request</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Clock size={28} className="text-yellow-400" />
          </div>
          <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Approved</p>
              <p className="text-3xl font-bold">{stats.approved}</p>
            </div>
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Package size={28} className="text-blue-400" />
          </div>
        </div>

        {newItems.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
            <div className="space-y-2">
              {newItems.map((n, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input className="border rounded p-2" placeholder="Item" value={n.name} onChange={(e) => updateRow(i, 'name', e.target.value)} />
                  <input type="number" className="border rounded p-2" placeholder="Qty" value={n.quantity} onChange={(e) => updateRow(i, 'quantity', e.target.value)} />
                  <input className="border rounded p-2" placeholder="Note" value={n.note} onChange={(e) => updateRow(i, 'note', e.target.value)} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={addRow} className="px-3 py-2 rounded bg-gray-100">Add Row</button>
              <button onClick={submit} className="px-3 py-2 rounded bg-green-600 text-white">Submit</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">My Requests</h3>
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No requests</p>
          ) : (
            <div className="space-y-3">
              {items.map((m) => (
                <div key={m._id} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-gray-500">Qty: {m.quantity} • {m.note || 'No note'}</div>
                    <div className="text-xs text-gray-400">{m.date}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RequestMaterials;
