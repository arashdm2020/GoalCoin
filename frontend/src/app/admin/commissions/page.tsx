'use client';

import { useState, useEffect, useCallback } from 'react';
import AddCommissionModal from '../../../components/AddCommissionModal';

const TABS = ['Reviewer Payouts', 'Fan Rewards', 'System Logs'];

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'All', date: '' });
  const [summary, setSummary] = useState({ total: '0.00', pending: 0, this_week: '0.00' });

  const fetchData = useCallback(async () => {
    let url = '';
    if (activeTab === 'Reviewer Payouts') {
      url = `/api/admin/commissions?status=${filters.status}&date=${filters.date}`;
    } else {
      // Placeholder for other tabs
      setData([]);
      setSummary({ total: '0.00', pending: 0, this_week: '0.00' });
      return;
    }

    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}${url}`, { headers: { 'Authorization': authHeader } });
      const result = await response.json();
      if (result.success) {
        const fetchedData = result.data || [];
        setData(fetchedData);
        // Calculate summary
        const totalUnpaid = fetchedData
          .filter((item: any) => !item.payout_id)
          .reduce((sum: number, item: any) => sum + (item.amount_usdt || 0), 0);
        const pendingCount = fetchedData.filter((item: any) => !item.payout_id).length;
        setSummary({ total: totalUnpaid.toFixed(2), pending: pendingCount, this_week: 'N/A' });
      } else {
        setData([]);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
      setData([]);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCommission = async (commissionData: { reviewer_wallet: string; submission_id: string; amount_usdt: number; reason: string; }) => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/commissions/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(commissionData),
      });
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchData(); // Refetch data
      } else {
        console.error('Failed to add commission:', result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding commission:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Reviewer Payouts':
        return (
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">Reviewer Wallet</th>
                <th className="p-4">Submission ID</th>
                <th className="p-4">Amount (USDT)</th>
                <th className="p-4">Earned At</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-4 font-mono"><a href={`https://etherscan.io/address/${item.reviewer_wallet}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">{item.reviewer_wallet}</a></td>
                  <td className="p-4 font-mono">{item.submission_id.substring(0, 10)}...</td>
                  <td className="p-4">${item.amount_usdt.toFixed(4)}</td>
                  <td className="p-4">{new Date(item.earned_at).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${item.payout_id ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {item.payout_id ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return <div className="text-center py-16"><p className="text-gray-500">{activeTab} is under construction.</p></div>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Commissions Management</h1>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Unpaid</h3>
          <p className="text-2xl font-bold text-yellow-400">${summary.total}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Pending Commissions</h3>
          <p className="text-2xl font-bold">{summary.pending}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Paid This Week</h3>
          <p className="text-2xl font-bold text-gray-500">{summary.this_week}</p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 bg-gray-800 rounded-lg" onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
          <input type="date" className="px-4 py-2 bg-gray-800 rounded-lg" onChange={e => setFilters({...filters, date: e.target.value})}/>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg">Add Manual</button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg">Export CSV</button>
        </div>
      </div>

      <AddCommissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddCommission} />

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
