import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Check, X, FileText, Calendar, Search, Image as ImageIcon } from 'lucide-react';

type ApprovalStatus = 'approved' | 'rejected' | 'pending';

interface DPRReport {
  _id: string;
  user?: { name?: string };
  imageUrl?: string;
  task?: string;
  approvalStatus?: ApprovalStatus;
  materials?: { name: string; quantity: number }[];
  hours?: number;
  date?: string;
  createdAt?: string;
}

interface DPRParams {
  startDate: string;
  endDate: string;
  approvalStatus?: Exclude<ApprovalStatus, 'pending'>;
  siteId?: string;
}

type AssignedSite = string | { _id: string; name?: string } | null;

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const getBaseUrl = () => {
  const axiosBase = (api as { defaults?: { baseURL?: string } }).defaults?.baseURL;
  const viteBase = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL;
  const base = axiosBase || viteBase || 'http://localhost:5000';
  return base.replace(/\/api$/, '').replace('/api', '');
};

const DPRApproval = () => {
  const [reports, setReports] = useState<DPRReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedSite, setAssignedSite] = useState<AssignedSite>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async (selected?: string) => {
    setLoading(true);
    try {
      const fil = selected || filter;
      if (fil === 'pending') {
        const { data } = await api.get<DPRReport[]>('/reports/pending');
        setReports(data || []);
      } else {
        const params: DPRParams = { startDate, endDate };
        if (fil === 'approved') params.approvalStatus = 'approved';
        if (fil === 'rejected') params.approvalStatus = 'rejected';
        if (assignedSite && typeof assignedSite === 'object') params.siteId = assignedSite._id;
        if (assignedSite && typeof assignedSite === 'string') params.siteId = assignedSite;
        const { data } = await api.get<DPRReport[]>('/reports/all', { params });
        if (fil === 'all') {
          try {
            const pend = await api.get<DPRReport[]>('/reports/pending');
            setReports([...(data || []), ...(pend.data || [])]);
          } catch {
            setReports(data || []);
          }
        } else {
          setReports(data || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate, assignedSite]);

  useEffect(() => {
    (async () => {
      try {
        const prof = await api.get<{ assignedSite?: string | { _id: string } }>('/auth/me');
        setAssignedSite(prof.data?.assignedSite || null);
      } catch (err) {
        console.error(err);
      }
      await loadData();
    })();
  }, [loadData]);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/reports/${id}/approval`, { status });
      setReports(prev => prev.filter(p => p._id !== id));
    } catch (e) { console.error(e); }
  };

  const filteredReports = reports.filter(r => 
    (filter === 'all' || r.approvalStatus === filter) &&
    (r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.task?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout role="supervisor">
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">DPR Approvals</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Review and manage daily progress reports.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Search reports..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white w-full sm:w-64 transition-all shadow-sm"
               />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
               <button 
                 onClick={() => { setFilter('all'); loadData('all'); }}
                 className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-none bg-transparent'}`}
               >
                 All
               </button>
               <button 
                 onClick={() => { setFilter('pending'); loadData('pending'); }}
                 className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${filter === 'pending' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-none bg-transparent'}`}
               >
                 Pending
               </button>
               <button 
                  onClick={() => { setFilter('approved'); loadData('approved'); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${filter === 'approved' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-none bg-transparent'}`}
               >
                 Approved
               </button>
               <button 
                  onClick={() => { setFilter('rejected'); loadData('rejected'); }}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${filter === 'rejected' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-none bg-transparent'}`}
               >
                 Rejected
               </button>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                title="Start date"
              />
              <span className="text-slate-400 dark:text-slate-500 text-xs">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                title="End date"
              />
              <button 
                className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                onClick={() => loadData(filter)}
                title="Apply date range"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FileText className="text-slate-300" size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white">No Reports Found</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-xs">
               {searchTerm ? 'Try adjusting your search terms.' : 'All daily reports have been reviewed.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((r) => (
              <div key={r._id} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                
                {/* Card Header */}
                <div className="p-6 pb-4 flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shadow-inner">
                         {r.user?.name?.[0] || 'W'}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{r.user?.name || 'Unknown Worker'}</h3>
                         <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-1">
                           <Calendar size={14} /> 
                            {new Date(r.date || r.createdAt || new Date().toISOString()).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                         </div>
                      </div>
                   </div>
                   <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                     r.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                     r.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                     'bg-yellow-50 text-yellow-700 border-yellow-200'
                   }`}>
                     {r.approvalStatus || 'Pending'}
                   </div>
                </div>
                
                {/* Content */}
                <div className="px-6 py-2 flex-1 space-y-4">
                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Task Description</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {r.task}
                      </p>
                   </div>
                   
                   {r.imageUrl && (
                     <div className="relative h-40 rounded-xl overflow-hidden group-hover:shadow-md transition-all">
                        <img 
                           src={`${getBaseUrl()}${r.imageUrl}`} 
                           alt="Site Work" 
                           className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-white text-xs font-medium flex items-center gap-2">
                             <ImageIcon size={14} /> View Evidence
                           </span>
                        </div>
                     </div>
                   )}

                   {/* Quick Stats */}
                   <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-2">
                       <div className="flex items-center gap-1.5">
                           <div className={`w-2 h-2 rounded-full ${r.materials?.length ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                           {r.materials?.length || 0} Materials
                       </div>
                       <div className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full bg-green-500"></div>
                           {r.hours || 8} Hours
                       </div>
                   </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 mt-auto">
                   <button 
                     onClick={() => handleApproval(r._id, 'approved')}
                     className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5"
                   >
                      <Check size={18} strokeWidth={2.5} /> Approve
                   </button>
                   <button 
                     onClick={() => handleApproval(r._id, 'rejected')}
                     className="px-4 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-900/50 rounded-xl text-sm font-bold transition-all"
                     title="Reject Report"
                   >
                      <X size={18} strokeWidth={2.5} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DPRApproval;
