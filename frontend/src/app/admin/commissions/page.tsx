'use client';

import { useState } from 'react';
import AddCommissionModal from '../../../components/AddCommissionModal';

// Mock data for demonstration
const mockPayouts = [
  { id: 1, wallet: '0x123...abc', amount: 100, currency: 'USDT', status: 'Queued', date: '2025-11-12' },
  { id: 2, wallet: '0x456...def', amount: 50, currency: 'GC', status: 'Sent', date: '2025-11-11' },
  { id: 3, wallet: '0x789...ghi', amount: 200, currency: 'USDT', status: 'Failed', date: '2025-11-10' },
];

const mockRewards = [
  { id: 1, user: 'user_a', amount: 10, currency: 'GC', status: 'Sent', date: '2025-11-12' },
  { id: 2, user: 'user_b', amount: 5, currency: 'GC', status: 'Sent', date: '2025-11-11' },
];

const mockLogs = [
  { id: 1, message: 'Payout job started', level: 'info', timestamp: '2025-11-12T10:00:00Z' },
  { id: 2, message: 'Payout for 0x456...def succeeded', level: 'info', timestamp: '2025-11-11T15:30:00Z' },
  { id: 3, message: 'Payout for 0x789...ghi failed: Insufficient funds', level: 'error', timestamp: '2025-11-10T09:00:00Z' },
];

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState('payouts');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCommission = (commission: { wallet: string; amount: number; currency: 'USDT' | 'GC' }) => {
    console.log('Adding manual commission:', commission);
    // Here you would typically make an API call
    const newPayout = {
      id: mockPayouts.length + 1,
      ...commission,
      status: 'Queued',
      date: new Date().toISOString().split('T')[0],
    };
    // For now, just adding to the mock data
    // This should be adapted based on whether it's a payout or reward
    if (activeTab === 'payouts') {
      // This is a simplification. You'd likely have a separate state for each tab.
      // setMockPayouts([...mockPayouts, newPayout]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Commissions</h1>

      {/* Summary Tiles */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Filters:</span>
          <select className="px-4 py-2 bg-gray-800 rounded-lg">
            <option>All Statuses</option>
            <option>Queued</option>
            <option>Sent</option>
            <option>Failed</option>
          </select>
          <input type="date" className="px-4 py-2 bg-gray-800 rounded-lg" />
        </div>
        <div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg mr-2">Add Manual Commission</button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg">Export CSV</button>
        </div>
      </div>

      <AddCommissionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCommission}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg">Total Paid</div>
        <div className="bg-gray-900 p-6 rounded-lg">Pending</div>
        <div className="bg-gray-900 p-6 rounded-lg">This Week</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button onClick={() => setActiveTab('payouts')} className={`px-6 py-3 ${activeTab === 'payouts' ? 'border-b-2 border-yellow-500' : ''}`}>Reviewer Payouts</button>
        <button onClick={() => setActiveTab('rewards')} className={`px-6 py-3 ${activeTab === 'rewards' ? 'border-b-2 border-yellow-500' : ''}`}>Fan Rewards</button>
        <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 ${activeTab === 'logs' ? 'border-b-2 border-yellow-500' : ''}`}>System Logs</button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'payouts' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4">Wallet</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Currency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockPayouts.map(payout => (
                  <tr key={payout.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4"><a href={`https://polygonscan.com/address/${payout.wallet}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{payout.wallet}</a></td>
                    <td className="p-4">{payout.amount}</td>
                    <td className="p-4">{payout.currency}</td>
                    <td className="p-4">{payout.status}</td>
                    <td className="p-4">{payout.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'rewards' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Currency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockRewards.map(reward => (
                  <tr key={reward.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4"><a href="#" className="hover:underline">{reward.user}</a></td>
                    <td className="p-4">{reward.amount}</td>
                    <td className="p-4">{reward.currency}</td>
                    <td className="p-4">{reward.status}</td>
                    <td className="p-4">{reward.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {mockLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${log.level === 'info' ? 'bg-blue-600' : 'bg-red-600'}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
