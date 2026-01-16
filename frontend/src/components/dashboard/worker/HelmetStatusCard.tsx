import React from 'react';
import { Wifi, WifiOff, HardHat, Clock, Signal } from 'lucide-react';

export interface HelmetStatusProps {
  isConnected: boolean;
  isWorn: boolean;
  alert?: boolean;
  lastSync: Date;
  signalStrength?: number; // 0-100
}

const HelmetStatusCard: React.FC<HelmetStatusProps> = ({ isConnected, isWorn, alert, lastSync, signalStrength = 85 }) => {
  const getSignalIcon = (strength: number) => {
    if (strength > 75) return <Signal className="text-green-500" size={18} />;
    if (strength > 40) return <Signal className="text-yellow-500" size={18} />;
    return <Signal className="text-red-500" size={18} />;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 transition-colors">
      <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
        <HardHat size={14} /> Helmet Status
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Alert Status */}
        <div className={`col-span-2 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${alert ? 'bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800 animate-pulse' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
             <div className={`w-3 h-3 rounded-full ${alert ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-slate-300'}`}></div>
             <span className={`text-sm font-bold ${alert ? 'text-red-700 dark:text-red-300' : 'text-slate-400'}`}>
                {alert ? 'LED ALERT ACTIVE' : 'Status Normal'}
             </span>
        </div>

        {/* Connection Status */}
        <div className={`p-3 rounded-xl border ${isConnected ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50'} flex flex-col items-center justify-center text-center transition-all`}>
          {isConnected ? <Wifi size={20} className="text-green-600 dark:text-green-400 mb-1.5" /> : <WifiOff size={20} className="text-red-600 dark:text-red-400 mb-1.5" />}
          <span className={`text-xs font-bold ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Wearing Status */}
        <div className={`p-3 rounded-xl border ${isWorn ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50'} flex flex-col items-center justify-center text-center transition-all`}>
          <HardHat size={20} className={`${isWorn ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} mb-1.5`} />
          <span className={`text-xs font-bold ${isWorn ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {isWorn ? 'Properly Worn' : 'Not Worn'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3 font-medium">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>Sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getSignalIcon(signalStrength)}
          <span>{signalStrength}% Signal</span>
        </div>
      </div>
    </div>
  );
};

export default HelmetStatusCard;
