import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  alert?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, alert }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${alert ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-950/20' : 'border-slate-800/60 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl'} p-6 flex flex-col justify-between group hover:border-slate-600/80 transition-all duration-300`}>
      {/* Subtle top glare effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-slate-400 font-semibold text-xs tracking-widest uppercase">{title}</h3>
        <div className={`p-2.5 rounded-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ${alert ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800/80 text-slate-300 shadow-inner'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3 relative z-10">
        <span className={`text-4xl font-bold tracking-tight font-mono ${alert ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-slate-100'}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-sm mb-1.5 font-bold flex items-center ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? (
              <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            ) : (
              <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
