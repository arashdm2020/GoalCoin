'use client';

import { useState, useEffect } from 'react';

const FeatureToggle = ({ toggle, onToggle }: { toggle: any; onToggle: (key: string, value: boolean) => void }) => (
  <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
    <div>
      <p className="font-semibold">/{toggle.key.replace(/_/g, '-')}</p>
      <p className="text-sm text-gray-400">{toggle.description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={toggle.value}
        onChange={(e) => onToggle(toggle.key, e.target.checked)}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
    </label>
  </div>
);

const StatusTile = ({ title, status }: { title: string; status: string }) => {
  const statusColor = status === 'operational' || status === 'connected' ? 'text-green-400' : 'text-yellow-400';
  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className={`text-2xl font-bold ${statusColor}`}>{status}</p>
    </div>
  );
};

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function SettingsPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [featureToggles, setFeatureToggles] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = localStorage.getItem('admin_auth_header');
        if (!authHeader) return;
        const headers = { 'Authorization': authHeader };

        const [statusRes, togglesRes, logsRes] = await Promise.all([
          fetch(`${getBackendUrl()}/api/admin/settings/status`, { headers }),
          fetch(`${getBackendUrl()}/api/admin/settings/feature-toggles`, { headers }),
          fetch(`${getBackendUrl()}/api/admin/settings/security-logs`, { headers }),
        ]);
        const statusData = await statusRes.json();
        const togglesData = await togglesRes.json();
        const logsData = await logsRes.json();

        if (statusData.success) setSystemStatus(statusData.data);
        if (togglesData.success) setFeatureToggles(togglesData.data);
        if (logsData.success) setSecurityLogs(logsData.data);
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
      }
    };
    fetchData();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/settings/feature-toggles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ key, value }),
      });
      const result = await response.json();
      if (result.success) {
        setFeatureToggles(toggles => toggles.map(t => t.key === key ? { ...t, value } : t));
      } else {
        console.error('Failed to update toggle:', result.error);
      }
    } catch (error) {
      console.error('Error updating toggle:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Status and Backups */}
        <div className="lg:col-span-1 space-y-8">
          <h2 className="text-xl font-semibold text-glow">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            {systemStatus ? (
              <>
                <StatusTile title="Mailgun" status={systemStatus.mailgun} />
                <StatusTile title="Redis" status={systemStatus.redis} />
                <StatusTile title="Database" status={systemStatus.database} />
              </>
            ) : <p className="text-gray-500">Loading status...</p>}
          </div>
          
          <h2 className="text-xl font-semibold text-glow">Backups</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            <p className="text-gray-400">Last backup: {systemStatus ? new Date(systemStatus.lastBackup).toLocaleString() : 'N/A'}</p>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Backup Now</button>
          </div>
        </div>

        {/* Middle Column: Feature Toggles */}
        <div className="lg:col-span-1 space-y-8">
          <h2 className="text-xl font-semibold text-glow">Feature Toggles</h2>
          <div className="space-y-4">
            {featureToggles.length > 0 ? (
              featureToggles.map(toggle => (
                <FeatureToggle key={toggle.key} toggle={toggle} onToggle={handleToggle} />
              ))
            ) : <p className="text-gray-500">Loading toggles...</p>}
          </div>
        </div>

        {/* Right Column: Security Logs */}
        <div className="lg:col-span-1 space-y-8">
          <h2 className="text-xl font-semibold text-glow">Security Logs</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.length > 0 ? (
                  securityLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-800">
                      <td className="p-3 font-mono">{log.action}</td>
                      <td className="p-3 font-mono">{log.target_id}</td>
                      <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-16 text-gray-500">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
