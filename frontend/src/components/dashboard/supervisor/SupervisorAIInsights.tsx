import React from 'react';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';

const SupervisorAIInsights: React.FC = () => {
  const insights = [
    { type: 'risk', text: 'Repeated helmet-off incidents detected in Zone B (3 workers).' },
    { type: 'health', text: 'Worker fatigue risk elevated for Team Alpha based on vitals.' },
    { type: 'env', text: 'Gas levels trending higher near the eastern excavation site.' }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-900/50 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} className="text-purple-600 dark:text-purple-400" />
        <h3 className="font-bold text-purple-900 dark:text-purple-100 text-sm">AI Safety Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex gap-3 items-start bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-black/30 transition-colors shadow-sm">
            {insight.type === 'risk' && <AlertCircle size={18} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />}
            {insight.type === 'health' && <Sparkles size={18} className="text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0" />}
            {insight.type === 'env' && <Sparkles size={18} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />}
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug font-medium">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupervisorAIInsights;
