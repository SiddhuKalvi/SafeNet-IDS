'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  time: string;
  packets: number;
  alerts: number;
}

export function RealTimeChart() {
  const [data, setData] = useState<ChartData[]>([
    { time: '00:00', packets: 120, alerts: 5 },
    { time: '04:00', packets: 240, alerts: 12 },
    { time: '08:00', packets: 450, alerts: 28 },
    { time: '12:00', packets: 680, alerts: 35 },
    { time: '16:00', packets: 920, alerts: 42 },
    { time: '20:00', packets: 1100, alerts: 55 },
  ]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const lastTime = parseInt(prev[prev.length - 1].time.split(':')[0]);
        const newTime = `${String((lastTime + 4) % 24).padStart(2, '0')}:00`;
        
        newData.push({
          time: newTime,
          packets: Math.floor(Math.random() * 1500) + 100,
          alerts: Math.floor(Math.random() * 60) + 5,
        });
        
        return newData;
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis dataKey="time" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #475569',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="packets" 
          stroke="#06b6d4" 
          strokeWidth={2}
          dot={{ fill: '#06b6d4', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="alerts" 
          stroke="#f97316" 
          strokeWidth={2}
          dot={{ fill: '#f97316', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
