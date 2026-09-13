import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RealTimeChartProps {
  data: any[];
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#64748b" 
          tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis 
          yAxisId="left" 
          stroke="#64748b" 
          tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
          tickLine={false}
          axisLine={false}
          dx={-10}
          label={{ value: 'TPS', angle: -90, position: 'insideLeft', fill: '#64748b', style: { textAnchor: 'middle' } }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          stroke="#64748b" 
          tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
          tickLine={false}
          axisLine={false}
          dx={10}
          label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', fill: '#64748b', style: { textAnchor: 'middle' } }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', padding: '12px', color: '#f8fafc' }}
          itemStyle={{ color: '#e2e8f0', fontWeight: 600, padding: '2px 0' }}
          labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }} iconType="circle" />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="tps" 
          name="Transactions / Sec"
          stroke="#38bdf8" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 3 }}
          animationDuration={300}
          style={{ filter: 'url(#glow)' }}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="latency" 
          name="P95 Latency"
          stroke="#fbbf24" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 3 }}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealTimeChart;
