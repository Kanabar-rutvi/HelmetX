import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Save, Bell, Shield, Database, Activity, Mail, Smartphone, RefreshCw } from 'lucide-react';

interface Config {
  thresholds: {
    temperature: number;
    gasLevel: number;
    heartRateMin: number;
    heartRateMax: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    adminEmails: string[];
    emergencyContacts: string[];
  };
  system: {
    dataRetentionDays: number;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maintenanceMode: boolean;
  };
}

const AdminSettings = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'notifications' | 'system'>('thresholds');

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get<Config>('/config');
      setConfig(data || null);
    } catch (error) {
      console.error('Failed to fetch config', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchConfig(); }, 0);
    return () => clearTimeout(t);
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/config', config);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNested = (section: keyof Config, key: string, value: string | number | boolean | string[]) => {
    if (!config) return;
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
  };

  if (loading) return <Layout role="admin"><div className="p-8 text-center">Loading settings...</div></Layout>;
  if (!config) return <Layout role="admin"><div className="p-8 text-center text-red-500">Error loading settings</div></Layout>;

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500">Configure thresholds, notifications, and system parameters</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <button 
              onClick={() => setActiveTab('thresholds')}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 ${activeTab === 'thresholds' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Activity size={18} /> Safety Thresholds
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell size={18} /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 ${activeTab === 'system' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield size={18} /> System & Security
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                <Activity className="text-indigo-600" size={20}/> Safety Thresholds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Temperature (°C)</label>
                  <input 
                    type="number" 
                    value={config.thresholds.temperature}
                    onChange={(e) => updateNested('thresholds', 'temperature', parseFloat(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Alert triggers above this value.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gas Level Limit (PPM)</label>
                  <input 
                    type="number" 
                    value={config.thresholds.gasLevel}
                    onChange={(e) => updateNested('thresholds', 'gasLevel', parseFloat(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Hazardous gas alert threshold.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Heart Rate (BPM)</label>
                  <input 
                    type="number" 
                    value={config.thresholds.heartRateMin}
                    onChange={(e) => updateNested('thresholds', 'heartRateMin', parseFloat(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Heart Rate (BPM)</label>
                  <input 
                    type="number" 
                    value={config.thresholds.heartRateMax}
                    onChange={(e) => updateNested('thresholds', 'heartRateMax', parseFloat(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                <Bell className="text-indigo-600" size={20}/> Notification Channels
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="text-slate-500"/>
                    <div>
                      <div className="font-medium text-slate-800">Email Notifications</div>
                      <div className="text-xs text-slate-500">Send alerts via email</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={config.notifications.emailEnabled} onChange={(e) => updateNested('notifications', 'emailEnabled', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-slate-500"/>
                    <div>
                      <div className="font-medium text-slate-800">SMS Notifications</div>
                      <div className="text-xs text-slate-500">Send alerts via SMS</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={config.notifications.smsEnabled} onChange={(e) => updateNested('notifications', 'smsEnabled', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Emails (comma separated)</label>
                  <input 
                    type="text" 
                    value={config.notifications.adminEmails.join(', ')}
                    onChange={(e) => updateNested('notifications', 'adminEmails', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="admin@example.com, manager@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contacts (comma separated)</label>
                  <input 
                    type="text" 
                    value={config.notifications.emergencyContacts.join(', ')}
                    onChange={(e) => updateNested('notifications', 'emergencyContacts', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1234567890, +0987654321"
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                <Database className="text-indigo-600" size={20}/> Data & Security
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Retention (Days)</label>
                    <input 
                      type="number" 
                      value={config.system.dataRetentionDays}
                      onChange={(e) => updateNested('system', 'dataRetentionDays', parseInt(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Backup Frequency</label>
                    <select 
                      value={config.system.backupFrequency}
                      onChange={(e) => updateNested('system', 'backupFrequency', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="text-yellow-600"/>
                    <div>
                      <div className="font-medium text-yellow-800">Maintenance Mode</div>
                      <div className="text-xs text-yellow-600">Suspend system operations for maintenance</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={config.system.maintenanceMode} onChange={(e) => updateNested('system', 'maintenanceMode', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-medium text-slate-800 mb-3">Data Backup</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Download a full system backup including users, devices, attendance, reports, and configurations.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const base = ((import.meta as ImportMeta).env?.VITE_API_URL || 'http://localhost:5000/api');
                        const resp = await fetch(
                          base + '/backup/download',
                          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
                        );
                        const blob = await resp.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        console.error(e);
                        alert('Backup failed');
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Database size={18} /> Backup Now
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
