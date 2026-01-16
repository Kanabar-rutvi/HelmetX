import React from 'react';
import { Phone, Shield, Ambulance, User } from 'lucide-react';

interface EmergencyCardProps {
  onSOS?: () => void;
}

const EmergencyCard: React.FC<EmergencyCardProps> = ({ onSOS }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 border border-red-100 dark:border-red-900/30 transition-colors">
      <h3 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
        <Shield size={18} /> Emergency Contacts
      </h3>
      
      <div className="space-y-3">
        <button 
          onClick={onSOS}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all animate-pulse hover:animate-none active:scale-95"
        >
          <Phone size={20} />
          SOS - PANIC BUTTON
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-center hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <User size={16} />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Supervisor</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">John Doe</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-center hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Ambulance size={16} />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">First Aid</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Station A</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCard;
