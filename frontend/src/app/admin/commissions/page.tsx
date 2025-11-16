'use client';

import { useState, useEffect, useCallback } from 'react';
import AddCommissionModal from '../../../components/AddCommissionModal';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '../../../hooks/useToastNotification';
import ConfirmDialog from '../../../components/ConfirmDialog';
import InputDialog from '../../../components/InputDialog';

const TABS = ['Reviewer Payouts', 'Fan Rewards', 'System Logs'];

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function CommissionsPage() {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'All', date: '' });
  const [summary, setSummary] = useState({ total: '0.00', pending: 0, this_week: '0.00' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder: string;
    onConfirm: (value: string) => void;
    commissionId?: string;
    reviewerWallet?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    onConfirm: () => {},
  });

  const fetchData = useCallback(async () => {
    let url = '';
    if (activeTab === 'Reviewer Payouts') {
      const statusParam = filters.status === 'All' ? '' : 
                         filters.status === 'PENDING' ? 'unpaid' : 
                         filters.status === 'PAID' ? 'paid' : '';
      url = `/api/admin/commissions?status=${statusParam}&date=${filters.date}&page=${currentPage}&limit=${itemsPerPage}`;
    } else if (activeTab === 'System Logs') {
      url = `/api/admin/settings/security-logs`;
    } else if (activeTab === 'Fan Rewards') {
      // Placeholder for Fan Rewards - will be implemented later
      setData([]);
      setSummary({ total: '0.00', pending: 0, this_week: '0.00' });
      setTotalItems(0);
      return;
    } else {
      setData([]);
      setSummary({ total: '0.00', pending: 0, this_week: '0.00' });
      setTotalItems(0);
      return;
    }

    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        console.log('No auth header found');
        return;
      }
      
      console.log('Fetching commissions from:', `${getBackendUrl()}${url}`);
      const response = await fetch(`${getBackendUrl()}${url}`, { headers: { 'Authorization': authHeader } });
      
      console.log('Commissions response status:', response.status);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setData([]);
        setTotalItems(0);
        return;
      }
      
      const result = await response.json();
      console.log('Commissions result:', result);
      
      // Handle both old format (Array) and new format ({ success: true, data: [...] })
      let fetchedData = [];
      let totalCount = 0;
      
      if (Array.isArray(result)) {
        // Old format - direct array
        fetchedData = result;
        totalCount = result.length;
        console.log('Using old format (direct array)');
      } else if (result.success) {
        // New format - { success: true, data: [...] }
        fetchedData = result.data || [];
        totalCount = result.total || 0;
        console.log('Using new format (success object)');
      } else {
        console.error('API returned error:', result);
        setData([]);
        setTotalItems(0);
        return;
      }
      
      setData(fetchedData);
      setTotalItems(totalCount);
      
      // Calculate summary
      const totalUnpaid = fetchedData
        .filter((item: any) => !item.payout_id)
        .reduce((sum: number, item: any) => sum + (item.amount_usdt || 0), 0);
      const pendingCount = fetchedData.filter((item: any) => !item.payout_id).length;
      
      // Calculate paid this week (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const paidThisWeek = fetchedData
        .filter((item: any) => {
          if (!item.payout_id) return false;
          const earnedDate = new Date(item.earned_at);
          return earnedDate >= oneWeekAgo;
        })
        .reduce((sum: number, item: any) => sum + (item.amount_usdt || 0), 0);
      
      setSummary({ 
        total: totalUnpaid.toFixed(2), 
        pending: pendingCount, 
        this_week: paidThisWeek > 0 ? paidThisWeek.toFixed(2) : '0.00' 
      });
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
      setData([]);
      setTotalItems(0);
    }
  }, [activeTab, filters, currentPage, itemsPerPage]);

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
        showError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding commission:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        showError('Not authenticated');
        return;
      }

      const response = await fetch(`${getBackendUrl()}/api/admin/export-csv?type=commissions`, {
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('CSV exported successfully');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      showError('Failed to export CSV. Please try again');
    }
  };

  const handleMarkAsPaid = async (commissionId: string, reviewerWallet: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark Commission as Paid',
      message: 'Are you sure you want to mark this commission as paid?',
      onConfirm: () => {
        // After confirmation, show input dialog for transaction hash
        setInputDialog({
          isOpen: true,
          title: 'Transaction Hash',
          message: 'Enter transaction hash (optional):',
          placeholder: 'e.g., 0x1234...abcd',
          onConfirm: (txHash) => executeMarkAsPaid(commissionId, reviewerWallet, txHash),
          commissionId,
          reviewerWallet,
        });
      },
    });
  };

  const executeMarkAsPaid = async (commissionId: string, reviewerWallet: string, txHash: string) => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        showError('Authentication required');
        return;
      }

      const finalTxHash = txHash.trim() || 'manual-payment';

      const response = await fetch(`${getBackendUrl()}/api/admin/commissions/mark-paid`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader 
        },
        body: JSON.stringify({
          commission_ids: [commissionId],
          reviewer_wallet: reviewerWallet,
          tx_hash: finalTxHash,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Commission marked as paid successfully');
        fetchData(); // Refresh the list
      } else {
        showError('Failed to mark commission as paid: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      showError('Failed to mark commission as paid. Please try again');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Reviewer Payouts':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 text-sm">Reviewer Wallet</th>
                  <th className="p-2 text-sm">Submission ID</th>
                  <th className="p-2 text-sm">Amount (USDT)</th>
                  <th className="p-2 text-sm">Earned At</th>
                  <th className="p-2 text-sm">Status</th>
                  <th className="p-2 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <p className="text-lg">No commissions found</p>
                        <p className="text-sm">No commissions match your current filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-2 text-sm font-mono">
                        <a href={`https://etherscan.io/address/${item.reviewer_wallet}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                          {item.reviewer_wallet.substring(0, 6)}...{item.reviewer_wallet.substring(item.reviewer_wallet.length - 4)}
                        </a>
                      </td>
                      <td className="p-2 text-sm font-mono">{item.submission_id.substring(0, 10)}...</td>
                      <td className="p-2 text-sm font-bold text-green-400">${item.amount_usdt.toFixed(2)}</td>
                      <td className="p-2 text-sm">{new Date(item.earned_at).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.payout_id ? 'bg-green-600' : 'bg-yellow-600'}`}>
                          {item.payout_id ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-2">
                        {!item.payout_id && (
                          <button
                            onClick={() => handleMarkAsPaid(item.id, item.reviewer_wallet)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white whitespace-nowrap"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalItems}
              />
            )}
          </div>
        );
      case 'System Logs':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-2 text-sm">Timestamp</th>
                  <th className="p-2 text-sm">Admin User</th>
                  <th className="p-2 text-sm">Action</th>
                  <th className="p-2 text-sm">Target ID</th>
                  <th className="p-2 text-sm">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <p className="text-lg">No system logs found</p>
                        <p className="text-sm">Admin actions will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((log: any) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-2 text-sm">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-2 text-sm font-semibold text-blue-400">
                        {log.admin_user || 'Unknown'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.action?.includes('APPROVE') ? 'bg-green-600' :
                          log.action?.includes('REJECT') ? 'bg-red-600' :
                          log.action?.includes('BULK') ? 'bg-purple-600' :
                          log.action?.includes('ASSIGN') ? 'bg-blue-600' :
                          'bg-gray-600'
                        }`}>
                          {log.action || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2 text-sm font-mono text-gray-400">
                        {log.target_id || 'N/A'}
                      </td>
                      <td className="p-2 text-sm text-gray-300">
                        {log.reason || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'Fan Rewards':
        return (
          <div className="text-center py-16">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white mb-2">Fan Rewards Coming Soon</h3>
              <p className="text-gray-400 mb-4">This feature will track and manage rewards for fan tier users</p>
              <div className="text-sm text-gray-500">
                <p>• Track fan engagement rewards</p>
                <p>• Manage bonus distributions</p>
                <p>• View reward history</p>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-center py-16"><p className="text-gray-500">{activeTab} is under construction.</p></div>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white text-glow mb-4 md:mb-8">Commissions Management</h1>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
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
      <div className="flex flex-col gap-4 mb-6 bg-gray-900 p-4 rounded-lg">
        {/* Tabs - Scrollable on mobile */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select 
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm flex-1" 
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
          <input 
            type="date" 
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm flex-1" 
            value={filters.date}
            onChange={e => setFilters({...filters, date: e.target.value})}
          />
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg text-sm whitespace-nowrap hover:bg-green-700">Add Manual</button>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 rounded-lg text-sm whitespace-nowrap hover:bg-blue-700">Export CSV</button>
        </div>
      </div>

      <AddCommissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddCommission} />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type="warning"
      />

      <InputDialog
        isOpen={inputDialog.isOpen}
        title={inputDialog.title}
        message={inputDialog.message}
        placeholder={inputDialog.placeholder}
        onConfirm={inputDialog.onConfirm}
        onCancel={() => setInputDialog({ ...inputDialog, isOpen: false })}
      />

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {renderContent()}
      </div>

      {ToastComponent}
    </div>
  );
}
