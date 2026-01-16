import React from 'react';
import { Clock, Coffee, LogIn, LogOut } from 'lucide-react';

interface ShiftEvent {
  type: 'check-in' | 'break' | 'work' | 'check-out';
  time: string;
  label: string;
}

const ShiftTimeline: React.FC = () => {
  // Mock Data
  const events: ShiftEvent[] = [
    { type: 'check-in', time: '08:00 AM', label: 'Shift Started' },
    { type: 'work', time: '10:00 AM', label: 'Zone B Inspection' },
    { type: 'break', time: '12:30 PM', label: 'Lunch Break' },
    { type: 'work', time: '01:30 PM', label: 'Back to Work' },
  ];

  const totalHours = '5h 30m';
  const progress = 65; // % of shift completed

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-blue-500" /> Shift Timeline
        </h3>
        <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg">
          {totalHours} Active
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-4 space-y-6 border-l-2 border-gray-100 dark:border-slate-700 ml-2">
        {events.map((event, idx) => (
          <div key={idx} className="relative">
            <div className={`absolute -left-[21px] w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center ${
              event.type === 'check-in' ? 'bg-green-500 text-white' :
              event.type === 'check-out' ? 'bg-gray-800 dark:bg-slate-600 text-white' :
              event.type === 'break' ? 'bg-orange-400 text-white' : 'bg-blue-500 text-white'
            }`}>
              {event.type === 'check-in' && <LogIn size={12} />}
              {event.type === 'check-out' && <LogOut size={12} />}
              {event.type === 'break' && <Coffee size={12} />}
              {event.type === 'work' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            
            <div className="pl-4">
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{event.time}</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{event.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftTimeline;
