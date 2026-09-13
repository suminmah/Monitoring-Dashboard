import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MetricsSummary {
    institutionId?: string;
    serviceType?: string;
    gateway?: string;
    totalVolume: number;
    successRate: number;
    timeoutRate: number;
    failureRate: number;
    systemicFailureRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    topErrorCodes: Record<string, number>;
}

interface DrillDownDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: MetricsSummary | null;
}

export const DrillDownDrawer: React.FC<DrillDownDrawerProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    // Simulate historical latency points based on current latencies
    // Real implementation would pull this from backend timeseries API.
    const timeAxis = ['T-4', 'T-3', 'T-2', 'T-1', 'Now'];
    const p50Data = [
        data.p50Latency * 0.9, data.p50Latency * 0.95, 
        data.p50Latency * 1.1, data.p50Latency * 0.8, data.p50Latency
    ];
    const p95Data = [
        data.p95Latency * 0.8, data.p95Latency * 0.9, 
        data.p95Latency * 1.05, data.p95Latency * 0.95, data.p95Latency
    ];

        const chartOption = {
        textStyle: {
            fontFamily: '"Inter", "Roboto", sans-serif'
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            textStyle: { color: '#f8fafc', fontSize: 12 },
            extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); border-radius: 8px;'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timeAxis,
            axisLabel: { color: '#94a3b8', fontSize: 11 },
            axisLine: { lineStyle: { color: '#334155' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8', fontSize: 11 },
            splitLine: { lineStyle: { color: '#1e293b', type: 'solid' } }
        },
        series: [
            {
                name: 'P95 Latency',
                type: 'line',
                data: p95Data,
                smooth: 0.4,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { color: '#f59e0b', width: 2 },
                itemStyle: { color: '#f59e0b', borderWidth: 2, borderColor: '#1e293b' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.25)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
                        ]
                    }
                }
            },
            {
                name: 'P50 Latency',
                type: 'line',
                data: p50Data,
                smooth: 0.4,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { color: '#10b981', width: 2 },
                itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#1e293b' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
                        ]
                    }
                }
            }
        ]
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-800/80 bg-slate-900/50">
                <h2 className="text-lg font-bold text-slate-100 tracking-wide">
                    {data.institutionId?.replace('_', ' ')} <span className="text-slate-500 mx-1">|</span> <span className="text-blue-400">{data.serviceType?.replace('_', ' ')}</span>
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto h-full pb-20 custom-scrollbar">
                
                {/* SLA Status */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">Health Overview</h3>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Success Rate</span>
                        <span className={`font-mono font-semibold ${data.successRate < 95 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {data.successRate.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Timeout Rate (Systemic)</span>
                        <span className={`font-mono font-semibold ${data.systemicFailureRate > 2 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {data.systemicFailureRate.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">P99 Anomaly</span>
                        <span className={`font-mono font-semibold ${data.p99Latency > 3000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {data.p99Latency}ms
                        </span>
                    </div>
                </div>

                {/* Latency Chart */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">Latency Trend</h3>
                    <div className="h-48 w-full -ml-2">
                        <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                    </div>
                </div>

                {/* Error Code Distribution */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">Top Error Codes</h3>
                    {Object.keys(data.topErrorCodes || {}).length === 0 ? (
                        <div className="flex items-center justify-center py-4">
                            <span className="text-sm text-slate-500 italic">No errors in this window.</span>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {Object.entries(data.topErrorCodes)
                                .sort(([,a], [,b]) => b - a)
                                .map(([code, count]) => (
                                <li key={code} className="flex justify-between items-center text-sm">
                                    <span className="text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded font-mono text-xs shadow-sm">RC: {code}</span>
                                    <span className="text-slate-400 font-medium">{count} occurrences</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
};
