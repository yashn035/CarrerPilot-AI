import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BreakdownChart({ breakdown }) {
  // Map breakdown to chart data
  const data = breakdown.map(item => ({
    name: item.metric,
    score: item.score,
    fill: item.score >= 80 ? '#22c55e' : item.score >= 50 ? '#eab308' : '#ef4444'
  }));

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-6">Score Breakdown</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b8b9a' }} width={120} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
              contentStyle={{ backgroundColor: '#1C1C28', border: '1px solid #323242', borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
