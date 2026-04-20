'use client';

import React, { useState } from 'react';
import { Settings, Plus, Trash2, Copy } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'blacklist' | 'whitelist'>('blacklist');
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [threatLevel, setThreatLevel] = useState('high');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch IP lists
  const { data: blacklistData, mutate: refetchBlacklist } = useSWR(
    '/api/ip-lists?type=blacklist',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: whitelistData, mutate: refetchWhitelist } = useSWR(
    '/api/ip-lists?type=whitelist',
    fetcher,
    { refreshInterval: 5000 }
  );

  const ipList = activeTab === 'blacklist' ? blacklistData?.ips || [] : whitelistData?.ips || [];

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/ip-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: newIp,
          listType: activeTab,
          reason: activeTab === 'blacklist' ? reason : undefined,
          threatLevel: activeTab === 'blacklist' ? threatLevel : undefined,
          description: activeTab === 'whitelist' ? reason : undefined,
        }),
      });

      if (response.ok) {
        setNewIp('');
        setReason('');
        if (activeTab === 'blacklist') {
          refetchBlacklist();
        } else {
          refetchWhitelist();
        }
      }
    } catch (error) {
      console.error('[v0] Failed to add IP:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveIp = async (ip: string) => {
    try {
      const response = await fetch('/api/ip-lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip,
          listType: activeTab,
        }),
      });

      if (response.ok) {
        if (activeTab === 'blacklist') {
          refetchBlacklist();
        } else {
          refetchWhitelist();
        }
      }
    } catch (error) {
      console.error('[v0] Failed to remove IP:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Settings className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-sm text-slate-400">Manage IP lists and configurations</p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {['blacklist', 'whitelist'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'blacklist' | 'whitelist')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Add IP Form */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">
            Add to {activeTab === 'blacklist' ? 'Blacklist' : 'Whitelist'}
          </h2>
          <form onSubmit={handleAddIp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <input
                type="text"
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                className="md:col-span-5 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />

              {activeTab === 'blacklist' ? (
                <>
                  <input
                    type="text"
                    placeholder="Reason for blacklist"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="md:col-span-4 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={threatLevel}
                    onChange={e => setThreatLevel(e.target.value)}
                    className="md:col-span-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="md:col-span-6 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              )}

              <button
                type="submit"
                disabled={isAdding || !newIp}
                className="md:col-span-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </form>
        </div>

        {/* IP List Table */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === 'blacklist' ? 'Blacklisted IPs' : 'Whitelisted IPs'} ({ipList.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    IP Address
                  </th>
                  {activeTab === 'blacklist' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Threat Level
                      </th>
                    </>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Description
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {ipList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No IPs in {activeTab}
                    </td>
                  </tr>
                ) : (
                  ipList.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-300">{item.ip_address}</span>
                      </td>
                      {activeTab === 'blacklist' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {item.reason || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              item.threat_level === 'critical'
                                ? 'bg-red-500/30 text-red-300'
                                : item.threat_level === 'high'
                                ? 'bg-orange-500/30 text-orange-300'
                                : item.threat_level === 'medium'
                                ? 'bg-yellow-500/30 text-yellow-300'
                                : 'bg-blue-500/30 text-blue-300'
                            }`}>
                              {item.threat_level}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {item.description || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveIp(item.ip_address)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-red-400"
                          title="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
