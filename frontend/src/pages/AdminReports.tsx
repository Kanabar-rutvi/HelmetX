import React, { useCallback, useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { FileSpreadsheet, FileText, Filter } from 'lucide-react';

interface Report {
  _id: string;
  user: {
    name: string;
    employeeId: string;
    email: string;
  };
  date: string;
  task: string;
  materials: { name: string; quantity: number; note?: string }[];
  status: string;
  imageUrl?: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const origin = api.defaults?.baseURL
    ? api.defaults.baseURL.replace(/\/api$/, '')
    : (import.meta as ImportMeta).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get<Report[]>(`/reports/all?${params.toString()}`);
      setReports(data || []);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(() => { fetchReports(); }, 0);
    return () => clearTimeout(t);
  }, [fetchReports]);

  const exportCSV = () => {
    const headers = ['Date', 'Employee', 'ID', 'Task', 'Materials Count', 'Status'];
    const rows = reports.map(r => [
      r.date,
      r.user.name,
      r.user.employeeId,
      r.task,
      r.materials.length,
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    window.print();
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileSpreadsheet size={18} /> Export CSV
          </button>
          <button 
            onClick={printPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <FileText size={18} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={20} />
          <span className="font-medium">Date Range:</span>
        </div>
        
        <input 
          type="date" 
          className="border rounded-lg px-3 py-2 text-sm"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-gray-400">to</span>
        <input 
          type="date" 
          className="border rounded-lg px-3 py-2 text-sm"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        
        <button 
          onClick={fetchReports}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Apply
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{report.user?.name}</div>
                  <div className="text-xs text-gray-500">{report.user?.employeeId}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {report.task}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {report.imageUrl ? (
                    <img
                      src={`${origin}${report.imageUrl}`}
                      alt="Report"
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.materials?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${report.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {report.status ? report.status.toUpperCase() : 'PENDING'}
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No reports found for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AdminReports;
