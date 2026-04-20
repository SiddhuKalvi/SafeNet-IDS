'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  color: 'red' | 'yellow' | 'blue' | 'cyan';
}

const colorClasses = {
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const iconColorClasses = {
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  blue: 'text-blue-400',
  cyan: 'text-cyan-400',
};

export function StatsCard({ icon: Icon, label, value, trend, color }: StatsCardProps) {
  return (
    <div className={`border rounded-xl p-6 bg-slate-800/30 backdrop-blur-sm ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          {trend && <p className="text-xs text-slate-400 mt-2">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-slate-700/50 ${iconColorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
