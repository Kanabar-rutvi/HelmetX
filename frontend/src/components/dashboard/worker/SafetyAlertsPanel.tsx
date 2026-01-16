import React from 'react';
import { AlertTriangle, Activity, Wind, Heart, UserMinus, BatteryWarning } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'GAS' | 'FALL' | 'HEART_RATE' | 'HELMET_OFF' | 'DISCONNECT' | 'SOS';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'critical';
  status: 'active' | 'resolved';
}

interface SafetyAlertsPanelProps {
  alerts: Alert[];
}

const SafetyAlertsPanel: React.FC<SafetyAlertsPanelProps> = ({ alerts }) => {
  const getAlertIcon = (type: string, size: number = 18) => {
    switch (type) {
      case 'GAS': return <Wind size={size} />;
      case 'FALL': return <Activity size={size} />;
      case 'HEART_RATE': return <Heart size={size} />;
      case 'HELMET_OFF': return <UserMinus size={size} />;
      case 'DISCONNECT': return <BatteryWarning size={size} />;
      case 'SOS': return <AlertTriangle size={size} />;
      default: return <AlertTriangle size={size} />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50';
      case 'low': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[200px] transition-colors">
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <AlertTriangle size={12} className="text-orange-500" />
          Live Alerts
        </h3>
        {alerts.some(a => a.status === 'active') && (
          <span className="animate-pulse flex h-1.5 w-1.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-2">
            <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded-full mb-1">
              <Activity size={14} className="text-green-500 dark:text-green-400" />
            </div>
            <p className="text-[10px] font-medium">Safe</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-1.5 rounded border flex items-start gap-1.5 transition-all ${getSeverityStyles(alert.severity)}`}>
              <div className="mt-0.5">{getAlertIcon(alert.type, 12)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-[10px] font-bold leading-tight truncate pr-1">{alert.message}</h4>
                  <span className="text-[8px] opacity-70 whitespace-nowrap font-medium">{alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SafetyAlertsPanel;
