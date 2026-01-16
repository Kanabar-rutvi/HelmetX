import React from 'react';
import { Sparkles, Brain } from 'lucide-react';

interface AIInsightsCardProps {
  insights: string[];
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden transition-colors">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white dark:bg-white/5 opacity-40 rounded-full blur-2xl"></div>
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-lg">
           <Brain size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm uppercase tracking-wider">AI Health & Safety Insights</h3>
      </div>
      
      <div className="space-y-3 relative z-10">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl backdrop-blur-sm border border-white/50 dark:border-indigo-500/20 shadow-sm hover:shadow-md transition-all">
              <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">{insight}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-indigo-400 dark:text-indigo-300 text-sm font-medium animate-pulse">
            Analyzing your safety patterns...
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsCard;
