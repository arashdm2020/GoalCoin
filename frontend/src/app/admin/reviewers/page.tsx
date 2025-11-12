'use client';

import { useState, useEffect, useCallback } from 'react';
import AddReviewerModal from '../../../components/AddReviewerModal';
import Tooltip from '../../../components/Tooltip';
import AuditDrawer from '../../../components/AuditDrawer';
import RangeSlider from '../../../components/RangeSlider';

// TODO: Define a proper type for the reviewer object

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<any>(null);
  const [auditVotes, setAuditVotes] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: 'All', accuracyMin: 0, accuracyMax: 1, date: '' });

  const fetchReviewers = useCallback(async () => {
    const params = new URLSearchParams({
      status: filters.status,
      accuracyMin: filters.accuracyMin.toString(),
      accuracyMax: filters.accuracyMax.toString(),
      date: filters.date,
    }).toString();

    try {
      // TODO: Add proper authentication
      const response = await fetch(`/api/admin/reviewers?${params}`);
      const result = await response.json();
      if (result.success) {
        setReviewers(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  const handleApiCall = async (url: string, method: string, body: object) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.success) {
        fetchReviewers();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed API call to ${url}:`, error);
      return false;
    }
  };

  const handleAddReviewer = async (wallet: string) => {
    const success = await handleApiCall('/api/admin/reviewers', 'POST', { wallet });
    if (success) setIsModalOpen(false);
  };

  const handleStatusChange = async (reviewerId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    await handleApiCall('/api/admin/reviewers/status', 'PUT', { reviewerId, status });
  };

  const handleResetStrikes = async (reviewerId: string) => {
    await handleApiCall('/api/admin/reviewers/reset-strikes', 'POST', { reviewerId });
  };

  const handleRemove = async (reviewerId: string) => {
    // TODO: Implement a proper 'remove' endpoint in the backend
    alert(`This should call an API to remove reviewer ${reviewerId}`);
  };

  const handleViewAudit = async (reviewer: any) => {
    setSelectedReviewer(reviewer);
    try {
      const response = await fetch(`/api/admin/reviewers/${reviewer.id}/audit`);
      const result = await response.json();
      if (result.success) {
        setAuditVotes(result.data);
      } else {
        setAuditVotes([]);
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setAuditVotes([]);
    }
    setIsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    window.open('/api/admin/export-csv?type=reviewers', '_blank');
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
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
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

      <AddReviewerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddReviewer={handleAddReviewer}
      />

      {selectedReviewer && (
        <AuditDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          wallet={selectedReviewer.user.wallet}
          votes={auditVotes}
        />
      )}

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
            {reviewers.map(reviewer => (
              <tr key={reviewer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-4">{reviewer.user?.wallet || 'N/A'}</td>
                <td className="p-4">{reviewer.voting_weight}x</td>
                <td className="p-4">
                  <Tooltip content={`Votes: ${reviewer.total_votes} | Wrong: ${reviewer.wrong_votes}`}>
                    {(reviewer.accuracy * 100).toFixed(2)}%
                  </Tooltip>
                </td>
                <td className="p-4">{reviewer.strikes}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${reviewer.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {reviewer.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    {reviewer.status === 'ACTIVE' ? (
                      <button onClick={() => handleStatusChange(reviewer.id, 'SUSPENDED')} className="text-yellow-400 hover:underline">Suspend</button>
                    ) : (
                      <button onClick={() => handleStatusChange(reviewer.id, 'ACTIVE')} className="text-green-400 hover:underline">Reinstate</button>
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