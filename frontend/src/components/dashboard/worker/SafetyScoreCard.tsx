import React from 'react';
import { Award, TrendingUp, ShieldCheck } from 'lucide-react';

const SafetyScoreCard: React.FC = () => {
  const score = 92;
  
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
      <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-emerald-100 text-sm font-medium mb-1">Daily Safety Score</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-emerald-200 text-sm">/100</span>
          </div>
        </div>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Award size={24} className="text-white" />
        </div>
      </div>

      <div className="mt-4 space-y-2 relative z-10">
        <div className="flex justify-between text-xs text-emerald-100">
          <span>Compliance</span>
          <span>High</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-50 mt-2">
          <TrendingUp size={12} />
          <span>Top 10% of workers today</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyScoreCard;
