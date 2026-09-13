import React from 'react';
import type { AlertEvent } from '../types.ts';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface AlertPanelProps {
  alerts: AlertEvent[];
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <CheckCircle2 size={48} className="mb-2 opacity-20" />
        <p>No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`relative overflow-hidden p-4 rounded-xl border flex gap-4 items-start animate-in slide-in-from-right-4 duration-300 shadow-md hover:shadow-lg transition-all ${alert.severity === 'CRITICAL'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}
        >
          {/* Subtle top glare effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
          
          <div className={`mt-0.5 p-2 rounded-lg backdrop-blur-sm ${alert.severity === 'CRITICAL' ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
            {alert.severity === 'CRITICAL' ? <AlertCircle size={20} className="text-rose-400" /> : <AlertTriangle size={20} className="text-amber-400" />}
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-sm tracking-wide uppercase">{alert.type}</span>
              <span className="text-xs font-mono opacity-60 whitespace-nowrap bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80 leading-relaxed font-medium">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple inline mock of checkcircle since we forgot to import it in this file
const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default AlertPanel;
