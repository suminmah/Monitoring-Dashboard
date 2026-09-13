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

interface MatrixDashboardProps {
    matrixData: MetricsSummary[];
    onCellClick: (inst: string, svc: string, data: MetricsSummary) => void;
}

const institutions = ["Bank_A", "Bank_B", "Wallet_C", "PSP_D"];
const services = ["IBFT", "QR_MERCHANT", "NPCI_CROSSBORDER", "ALIPAY_INBOUND", "SETTLE_INSTANT", "SETTLE_BATCH", "SETTLE_ON_REQUEST"];

export const MatrixDashboard: React.FC<MatrixDashboardProps> = ({ matrixData, onCellClick }) => {
    
    // Map matrix data to ECharts heatmap format: [xIndex, yIndex, value, extraData...]
    const heatmapData = [];
    
    for (let y = 0; y < institutions.length; y++) {
        for (let x = 0; x < services.length; x++) {
            const inst = institutions[y];
            const svc = services[x];
            const data = matrixData.find(d => d.institutionId === inst && d.serviceType === svc);
            
            if (data && data.totalVolume > 0) {
                // Calculate a health score 0-100 where 100 is perfect
                let health = 100;
                if (data.failureRate > 8 || data.systemicFailureRate > 2 || data.p99Latency > 3000) {
                    health = 20; // Critical
                } else if (data.failureRate > 2 || data.p95Latency > 2000) {
                    health = 60; // Warning
                } else {
                    health = 95; // Healthy
                }
                
                heatmapData.push([x, y, health, data]);
            } else {
                heatmapData.push([x, y, null, null]);
            }
        }
    }

    const option = {
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: '"Inter", "Roboto", sans-serif'
        },
        tooltip: {
            position: 'top',
            backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900 with opacity
            borderColor: '#334155', // slate-700
            borderWidth: 1,
            padding: 12,
            textStyle: { color: '#f8fafc' },
            extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); border-radius: 8px;',
            formatter: function (params: any) {
                const data = params.data[3];
                if (!data) return '<div class="text-slate-400">No Traffic</div>';
                return `
                    <div class="font-sans min-w-[160px]">
                        <div class="font-bold text-slate-100 border-b border-slate-700 pb-2 mb-2 tracking-wide text-sm">
                            ${institutions[params.data[1]]} <span class="text-slate-500 mx-1">|</span> <span class="text-blue-400">${services[params.data[0]]}</span>
                        </div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-slate-400 text-xs uppercase tracking-wider">Volume</span>
                            <span class="font-mono font-semibold">${data.totalVolume} tx/m</span>
                        </div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-slate-400 text-xs uppercase tracking-wider">Success</span>
                            <span class="font-mono text-emerald-400">${data.successRate.toFixed(1)}%</span>
                        </div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-slate-400 text-xs uppercase tracking-wider">Failure</span>
                            <span class="font-mono text-rose-400">${data.failureRate.toFixed(1)}%</span>
                        </div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-slate-400 text-xs uppercase tracking-wider">Timeout</span>
                            <span class="font-mono text-amber-400">${data.timeoutRate.toFixed(1)}%</span>
                        </div>
                        <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50">
                            <span class="text-slate-400 text-xs uppercase tracking-wider">P95 Latency</span>
                            <span class="font-mono font-bold ${data.p95Latency > 2000 ? 'text-amber-400' : 'text-slate-200'}">${data.p95Latency}ms</span>
                        </div>
                    </div>
                `;
            }
        },
        grid: {
            height: '75%',
            top: '8%',
            left: '10%',
            right: '5%'
        },
        xAxis: {
            type: 'category',
            data: services.map(s => s.replace('_', ' ')),
            splitArea: { show: false },
            axisLabel: { color: '#94a3b8', fontWeight: 500, margin: 12 },
            axisLine: { lineStyle: { color: '#334155' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'category',
            data: institutions.map(i => i.replace('_', ' ')),
            splitArea: { show: false },
            axisLabel: { color: '#94a3b8', fontWeight: 500, margin: 12 },
            axisLine: { lineStyle: { color: '#334155' } },
            axisTick: { show: false }
        },
        visualMap: {
            min: 0,
            max: 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            itemWidth: 15,
            itemHeight: 120,
            inRange: {
                color: ['#be123c', '#d97706', '#059669'] // Rose-700 -> Amber-600 -> Emerald-600
            },
            textStyle: { color: '#64748b' } // slate-500
        },
        series: [{
            name: 'Health Matrix',
            type: 'heatmap',
            data: heatmapData,
            label: {
                show: true,
                formatter: function(params: any) {
                    const data = params.data[3];
                    if (!data) return '-';
                    return [
                        `{vol|${data.totalVolume} tx}`,
                        `{suc|S: ${data.successRate.toFixed(1)}%}`,
                        `{fail|F: ${data.failureRate.toFixed(1)}%}`,
                        `{time|T: ${data.timeoutRate.toFixed(1)}%}`
                    ].join('\n');
                },
                rich: {
                    vol: { color: '#f8fafc', fontWeight: 700, padding: [0, 0, 6, 0], fontSize: 13, textShadowBlur: 2, textShadowColor: 'rgba(0,0,0,0.5)' },
                    suc: { color: '#6ee7b7', fontSize: 11, fontWeight: 600, padding: [1, 0] }, // emerald-300
                    fail: { color: '#fda4af', fontSize: 11, fontWeight: 600, padding: [1, 0] }, // rose-300
                    time: { color: '#fcd34d', fontSize: 11, fontWeight: 600, padding: [1, 0] } // amber-300
                }
            },
            itemStyle: {
                borderColor: '#0f172a', // slate-900 background gap
                borderWidth: 4,
                borderRadius: 6 // rounded cells for premium feel
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 15,
                    shadowColor: 'rgba(0, 0, 0, 0.8)',
                    borderColor: '#475569',
                    borderWidth: 2
                }
            }
        }]
    };

    const onEvents = {
        'click': (params: any) => {
            if (params.data && params.data[3]) {
                const x = params.data[0];
                const y = params.data[1];
                onCellClick(institutions[y], services[x], params.data[3]);
            }
        }
    };

    return (
        <div className="w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl shadow-2xl border border-slate-800/60 overflow-hidden">
            <div className="p-5 bg-slate-900/50 border-b border-slate-800/60 backdrop-blur-sm flex items-center justify-between">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wide">
                    Live Telemetry Matrix
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">1Hz Sync</span>
                </div>
            </div>
            <div className="p-4" style={{ height: '460px' }}>
                <ReactECharts 
                    option={option} 
                    style={{ height: '100%', width: '100%' }}
                    onEvents={onEvents}
                    theme="dark"
                />
            </div>
        </div>
    );
};
