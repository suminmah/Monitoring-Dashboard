import React, { useEffect, useState } from 'react';
import { connectWebSocket } from '../services/websocket.ts';
import type { MetricsSummary, AlertEvent } from '../types.ts';
import KPICard from './KPICard.tsx';
import RealTimeChart from './RealTimeChart.tsx';
import AlertPanel from './AlertPanel.tsx';
import { MatrixDashboard } from './MatrixDashboard.tsx';
import { DrillDownDrawer } from './DrillDownDrawer.tsx';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any | null>(null);

  useEffect(() => {
    const client = connectWebSocket(
      (newMetrics) => {
        setMetrics(newMetrics);

        // Add to chart data, keeping last 30 points (approx 60 seconds if 2s interval)
        setChartData((prev) => {
          const newData = [...prev, {
            time: new Date(newMetrics.timestamp).toLocaleTimeString(),
            tps: newMetrics.totalVolume / 60, // approximate TPS from 1m volume
            latency: newMetrics.p95Latency
          }];
          if (newData.length > 30) newData.shift();
          return newData;
        });
      },
      (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev].slice(0, 50)); // Keep last 50 alerts
      },
      (newMatrix) => {
        setMatrixData(newMatrix);
        
        // If drawer is open, auto-update the data inside it
        setDrawerData((prev: any) => {
           if (prev) {
               return newMatrix.find((d: any) => d.institutionId === prev.institutionId && d.serviceType === prev.serviceType) || prev;
           }
           return prev;
        });
      }
    );

    return () => {
      client.deactivate();
    };
  }, []);

  const handleCellClick = (_inst: string, _svc: string, data: any) => {
      setDrawerData(data);
      setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <DrillDownDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} data={drawerData} />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Global 1m Volume"
          value={metrics ? metrics.totalVolume.toString() : '---'}
          icon={<Activity className="text-primary" />}
        />
        <KPICard
          title="Global Success Rate"
          value={metrics ? `${metrics.successRate.toFixed(2)}%` : '---'}
          icon={<CheckCircle className="text-success" />}
          trend={metrics && metrics.successRate > 95 ? 'up' : 'down'}
        />
        <KPICard 
          title="Global Failure Rate" 
          value={metrics ? `${metrics.failureRate.toFixed(2)}%` : '---'} 
          icon={<AlertTriangle className="text-danger" />} 
          alert={metrics ? metrics.failureRate > 5 : false}
        />
        <KPICard 
          title="Systemic Timeout Rate" 
          value={metrics ? `${metrics.systemicFailureRate?.toFixed(2) || '0.00'}%` : '---'} 
          icon={<Clock className="text-warning" />} 
          alert={metrics ? (metrics as any).systemicFailureRate > 2 : false}
        />
      </div>
      
      {/* Matrix */}
      <MatrixDashboard matrixData={matrixData} onCellClick={handleCellClick} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/60 p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wide">
            <Activity size={20} className="text-blue-400" />
            Global Real-Time TPS & P95 Latency
          </h2>
          <div className="h-[400px]">
            <RealTimeChart data={chartData} />
          </div>
        </div>

        {/* Alert Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-slate-800/60 p-5 shadow-2xl flex flex-col h-[400px] lg:h-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400 tracking-wide">
            <AlertTriangle size={20} className="text-rose-400" />
            Live Alerts
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
