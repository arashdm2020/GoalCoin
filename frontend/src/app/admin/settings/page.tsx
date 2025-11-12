'use client';

import { useState } from 'react';

// Mock data for demonstration
const mockLogs = [
  { user: 'admin', action: 'Force Approved Submission #123', ipHash: '...a1b2', timestamp: '2025-11-12T10:00:00Z' },
  { user: 'admin', action: 'Suspended Reviewer 0x456...def', ipHash: '...c3d4', timestamp: '2025-11-11T15:30:00Z' },
];

const mockEnv = {
  DATABASE_URL: 'present',
  JWT_SECRET: 'present',
  MAILGUN_API_KEY: 'absent',
};

export default function SettingsPage() {
  const [toggles, setToggles] = useState({
    roadmap: true,
    burnTracker: true,
    docs: true,
    transparency: true,
    invite: false,
    friends: false,
    store: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles({ ...toggles, [key]: !toggles[key] });
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">System Settings</h1>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg">Mailgun: Partial</div>
        <div className="bg-gray-900 p-6 rounded-lg">Redis: Free</div>
        <div className="bg-gray-900 p-6 rounded-lg">Backups: Manual <button className="ml-4 px-2 py-1 bg-blue-600 rounded-lg">Backup Now</button></div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Feature Toggles</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(toggles).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <input type="checkbox" id={key} checked={value} onChange={() => handleToggle(key as keyof typeof toggles)} className="mr-2" />
              <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Security Logs</h2>
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">IP Hash</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, index) => (
              <tr key={index} className="border-b border-gray-800">
                <td className="p-3">{log.user}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 font-mono text-sm">{log.ipHash}</td>
                <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Env Check */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Environment Check</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(mockEnv).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-2 ${value === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
