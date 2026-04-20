'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Activity, Shield, TrendingUp, Play, Square } from 'lucide-react';
import useSWR from 'swr';
import { StatsCard } from './stats-card';
import { AlertsList } from './alerts-list';
import { RealTimeChart } from './realtime-chart';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Dashboard() {
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'running'>('idle');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Fetch stats
  const { data: stats, mutate: refetchStats } = useSWR('/api/stats?hours=24', fetcher, {
    refreshInterval: 5000,
  });

  // Fetch alerts
  const { data: alertsData, mutate: refetchAlerts } = useSWR(
    `/api/alerts?limit=20${selectedSeverity !== 'all' ? `&severity=${selectedSeverity}` : ''}`,
    fetcher,
    { refreshInterval: 3000 }
  );

  // Fetch capture status
  const { data: captureData } = useSWR('/api/capture/start', fetcher, {
    refreshInterval: 1000,
  });

  useEffect(() => {
    if (captureData?.status === 'running') {
      setCaptureStatus('running');
      // Refresh stats more frequently when capturing
      refetchStats();
      refetchAlerts();
    } else {
      setCaptureStatus('idle');
    }
  }, [captureData]);

  const handleStartCapture = async () => {
    try {
      await fetch('/api/capture/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: 'eth0' }),
      });
      setCaptureStatus('running');
      refetchStats();
    } catch (error) {
      console.error('[v0] Failed to start capture:', error);
    }
  };

  const handleStopCapture = async () => {
    try {
      await fetch('/api/capture/stop', { method: 'POST' });
      setCaptureStatus('idle');
    } catch (error) {
      console.error('[v0] Failed to stop capture:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">SafeNet IDS</h1>
                <p className="text-sm text-slate-400">Network Intrusion Detection System</p>
              </div>
            </div>

            {/* Capture Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className={`w-2 h-2 rounded-full ${captureStatus === 'running' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-sm text-slate-300">
                  {captureStatus === 'running' ? 'Capturing' : 'Idle'}
                </span>
              </div>

              {captureStatus === 'idle' ? (
                <button
                  onClick={handleStartCapture}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
                >
                  <Play className="w-4 h-4" />
                  Start Capture
                </button>
              ) : (
                <button
                  onClick={handleStopCapture}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  <Square className="w-4 h-4" />
                  Stop Capture
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={AlertCircle}
            label="Critical Alerts"
            value={stats?.alertCounts?.critical || 0}
            trend="↑ 12%"
            color="red"
          />
          <StatsCard
            icon={TrendingUp}
            label="Warning Alerts"
            value={stats?.alertCounts?.warning || 0}
            trend="↑ 8%"
            color="yellow"
          />
          <StatsCard
            icon={Activity}
            label="Total Packets"
            value={stats?.packetCount || 0}
            trend="↑ 24%"
            color="blue"
          />
          <StatsCard
            icon={Shield}
            label="Threat Sources"
            value={stats?.uniqueSourceIps || 0}
            trend="↑ 5%"
            color="cyan"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-white">Real-time Traffic</h2>
            <RealTimeChart />
          </div>

          {/* Top Threats */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-white">Top Threat Sources</h2>
            <div className="space-y-3">
              {stats?.topThreatSources?.slice(0, 5).map((source: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                  <span className="text-sm text-slate-300 font-mono">{source.ip}</span>
                  <span className="text-sm font-semibold text-red-400">{source.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex gap-2">
          {['all', 'critical', 'warning', 'info'].map(severity => (
            <button
              key={severity}
              onClick={() => setSelectedSeverity(severity)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                selectedSeverity === severity
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {severity}
            </button>
          ))}
        </div>

        {/* Alerts Table */}
        <AlertsList alerts={alertsData?.alerts || []} onRefresh={refetchAlerts} />
      </div>
    </main>
  );
}

export default Dashboard;
