'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  source_ip: string;
  destination_ip: string;
  description: string;
  detection_rule: string;
  is_resolved: boolean;
  created_at: string;
  packet_count: number;
}

interface AlertsListProps {
  alerts: Alert[];
  onRefresh: () => void;
}

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const severityBadgeColors = {
  critical: 'bg-red-500/30 text-red-300',
  warning: 'bg-yellow-500/30 text-yellow-300',
  info: 'bg-blue-500/30 text-blue-300',
};

export function AlertsList({ alerts, onRefresh }: AlertsListProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (alertId: string) => {
    setResolving(alertId);
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, isResolved: true }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('[v0] Failed to resolve alert:', error);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Source IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No alerts found
                </td>
              </tr>
            ) : (
              alerts.map(alert => (
                <tr
                  key={alert.id}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                    alert.is_resolved ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-300">
                      {alert.alert_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-300">{alert.source_ip}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-300">{alert.destination_ip}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        severityBadgeColors[alert.severity]
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolving === alert.id}
                        className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                        title="Resolve alert"
                      >
                        <Check className="w-4 h-4 text-green-400" />
                      </button>
                    )}
                    {alert.is_resolved && (
                      <span className="text-xs text-slate-500">Resolved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
