'use client';

import { useState } from 'react';
import AddReviewerModal from '../../../components/AddReviewerModal';
import Tooltip from '../../../components/Tooltip';
import AuditDrawer from '../../../components/AuditDrawer';
import RangeSlider from '../../../components/RangeSlider';

// Mock data for demonstration
const mockReviewers = [
  { id: 1, wallet: '0x123...abc', weight: 1, accuracy: 0.95, strikes: 0, status: 'Active' },
  { id: 2, wallet: '0x456...def', weight: 2, accuracy: 0.88, strikes: 2, status: 'Active' },
  { id: 3, wallet: '0x789...ghi', weight: 1, accuracy: 0.76, strikes: 3, status: 'Suspended' },
];

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState(mockReviewers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<any>(null);
  const [filters, setFilters] = useState({ status: 'All', accuracyMin: 0, accuracyMax: 1, date: '' });

  const filteredReviewers = reviewers.filter(r => {
    if (filters.status !== 'All' && r.status !== filters.status) return false;
    if (r.accuracy < filters.accuracyMin || r.accuracy > filters.accuracyMax) return false;
    // Date filtering logic will go here
    return true;
  });

  const mockVotes = Array.from({ length: 20 }, (_, i) => ({
    id: `v${1000 + i}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    result: (Math.random() > 0.2 ? 'Correct' : 'Wrong') as 'Correct' | 'Wrong',
    ipHash: `...${(Math.random() * 0xFFFFFF << 0).toString(16).slice(-4)}`,
  }));

  const handleViewAudit = (reviewer: any) => {
    setSelectedReviewer(reviewer);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = (id: number, newStatus: 'Active' | 'Suspended') => {
    setReviewers(reviewers.map(r => r.id === id ? { ...r, status: newStatus, strikes: newStatus === 'Active' ? 0 : r.strikes } : r));
  };

  const handleRemove = (id: number) => {
    setReviewers(reviewers.filter(r => r.id !== id));
  };

  const handleResetStrikes = (id: number) => {
    setReviewers(reviewers.map(r => r.id === id ? { ...r, strikes: 0 } : r));
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Wallet', 'Voting Weight', 'Accuracy', 'Strikes', 'Status'];
    const rows = filteredReviewers.map(r => 
      [r.id, r.wallet, r.weight, r.accuracy, r.strikes, r.status].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reviewers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddReviewer = (wallet: string) => {
    const newReviewer = {
      id: reviewers.length + 1,
      wallet,
      weight: 1,
      accuracy: 1,
      strikes: 0,
      status: 'Active',
    };
    setReviewers([...reviewers, newReviewer]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Reviewer Management</h1>

      {/* Filters and Actions */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg">
        <div>
          <div className="flex items-center space-x-4">
          <span className="text-gray-400">Filters:</span>
          <select 
            className="px-4 py-2 bg-gray-800 rounded-lg" 
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Accuracy:</span>
            <RangeSlider 
              min={0} 
              max={1} 
              step={0.01} 
              onChange={({ min, max }) => setFilters({ ...filters, accuracyMin: min, accuracyMax: max })}
            />
          </div>
          <input 
            type="date" 
            className="px-4 py-2 bg-gray-800 rounded-lg" 
            onChange={e => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
        </div>
        <div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg mr-2">Add Reviewer</button>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 rounded-lg">Export CSV</button>
        </div>
      </div>

      {/* Reviewers Table */}
            <AddReviewerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddReviewer={handleAddReviewer}
      />

      {/* Reviewers Table */}
            {selectedReviewer && (
        <AuditDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          wallet={selectedReviewer.wallet}
          votes={mockVotes}
        />
      )}

      {/* Reviewers Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Wallet</th>
              <th className="p-4">Voting Weight</th>
              <th className="p-4">
                <Tooltip content="accuracy = 1 - wrong/total">
                  Accuracy
                </Tooltip>
              </th>
              <th className="p-4">Strikes</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviewers.map(reviewer => (
              <tr key={reviewer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-4">{reviewer.wallet}</td>
                <td className="p-4">{reviewer.weight}x</td>
                <td className="p-4">
                  <Tooltip content={`Raw: ${reviewer.accuracy}`}>
                    {(reviewer.accuracy * 100).toFixed(2)}%
                  </Tooltip>
                </td>
                <td className="p-4">{reviewer.strikes}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${reviewer.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {reviewer.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    {reviewer.status === 'Active' ? (
                      <button onClick={() => handleStatusChange(reviewer.id, 'Suspended')} className="text-yellow-400 hover:underline">Suspend</button>
                    ) : (
                      <button onClick={() => handleStatusChange(reviewer.id, 'Active')} className="text-green-400 hover:underline">Reinstate</button>
                    )}
                    <button onClick={() => handleResetStrikes(reviewer.id)} className="text-blue-400 hover:underline">Reset Strikes</button>
                    <button onClick={() => handleRemove(reviewer.id)} className="text-red-400 hover:underline">Remove</button>
                    <button onClick={() => handleViewAudit(reviewer)} className="text-gray-400 hover:underline">View Audit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
