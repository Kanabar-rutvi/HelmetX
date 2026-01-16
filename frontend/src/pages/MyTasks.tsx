import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const MyTasks = () => {
  type MyReport = { _id: string; date: string; task: string; imageUrl?: string };
  const [reports, setReports] = useState<MyReport[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/reports/me');
      setReports(r.data as MyReport[]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { const t = setTimeout(() => { load(); }, 0); return () => clearTimeout(t); }, [load]);

  return (
    <Layout role="worker">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Tasks</h1>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          {reports.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r) => (
                <div key={r._id} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{r.date}</span>
                  </div>
                  <p className="text-sm text-gray-700">{r.task}</p>
                  {r.imageUrl && (
                    <img
                      src={`${api.defaults?.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : (import.meta as ImportMeta).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${r.imageUrl}`}
                      alt="Work"
                      className="mt-3 rounded-lg border h-40 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyTasks;
