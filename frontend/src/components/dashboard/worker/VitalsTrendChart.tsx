import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer } from 'lucide-react';

interface VitalsTrendChartProps {
  data: { time: string; value: number }[];
  type: 'heartRate' | 'temperature';
  currentValue: number;
}

const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ data, type, currentValue }) => {
  const isHeartRate = type === 'heartRate';
  const color = isHeartRate ? '#ef4444' : '#f59e0b'; // Red for HR, Amber for Temp
  const bg = isHeartRate ? 'bg-red-50' : 'bg-orange-50';
  const iconColor = isHeartRate ? 'text-red-500' : 'text-orange-500';
  const label = isHeartRate ? 'Heart Rate' : 'Environment Temp';
  const unit = isHeartRate ? 'BPM' : '°C';

  // Determine safety status
  let status = 'Normal';
  let statusColor = 'text-green-600';
  
  if (isHeartRate) {
    if (currentValue > 100) { status = 'High'; statusColor = 'text-red-600'; }
    else if (currentValue < 60 && currentValue > 0) { status = 'Low'; statusColor = 'text-yellow-600'; }
  } else {
    if (currentValue > 38) { status = 'High'; statusColor = 'text-red-600'; }
  }
  
  if (currentValue === 0) { status = 'No Data'; statusColor = 'text-gray-400'; }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{currentValue > 0 ? currentValue : '--'}</h3>
            <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">{unit}</span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${isHeartRate ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          {isHeartRate ? <Activity size={20} className={iconColor} /> : <Thermometer size={20} className={iconColor} />}
        </div>
      </div>

      <div className="h-[100px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#6b7280', fontSize: '12px' }}
              itemStyle={{ color: color, fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color${type})`} 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-400">Last 30 mins</span>
        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
      </div>
    </div>
  );
};

export default VitalsTrendChart;
