'use client';

import { useState, useEffect } from 'react';
import EvidenceViewer from '../../../components/EvidenceViewer';
import ReasonModal from '../../../components/ReasonModal';
import AssignReviewerModal from '../../../components/AssignReviewerModal';


export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // TODO: Add proper filtering and pagination
        const response = await fetch('/api/admin/submissions');
        const result = await response.json();
        if (result.success) {
          setSubmissions(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      }
    };

    fetchSubmissions();
  }, []);
  const [selected, setSelected] = useState<number[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'Approve' | 'Reject'>('Approve');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [filters, setFilters] = useState({ status: 'All', date: '', country: 'All' });

  const filteredSubmissions = submissions.filter(s => {
    if (filters.status !== 'All' && s.status !== filters.status) return false;
    if (filters.country !== 'All' && s.country !== filters.country) return false;
    // Date filtering logic will go here
    return true;
  });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [reviewers, setReviewers] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const response = await fetch('/api/admin/reviewers?status=ACTIVE');
        const result = await response.json();
        if (result.success) {
          setReviewers(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch reviewers:', error);
      }
    };

    fetchReviewers();
  }, []);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  const handleSyncLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard/recalculate', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        // Optionally, show a success message
        alert('Leaderboard recalculation triggered!');
      } else {
        console.error('Failed to sync leaderboard:', result.error);
      }
    } catch (error) {
      console.error('Error syncing leaderboard:', error);
    }
  };

  const handleBulkAction = async (action: 'Approve' | 'Reject') => {
    if (selected.length === 0) return;

    const newStatus = action === 'Approve' ? 'APPROVED' : 'REJECTED';

    try {
      const response = await fetch('/api/admin/submissions/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionIds: selected, status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        setSelected([]);
        setIsBulkActionsOpen(false);
        // Refetch submissions to update the list
        const fetchSubmissions = async () => {
          const res = await fetch('/api/admin/submissions');
          const data = await res.json();
          if (data.success) setSubmissions(data.data);
        };
        fetchSubmissions();
      } else {
        console.error('Failed to perform bulk action:', result.error);
      }
    } catch (error) {
      console.error('Error in handleBulkAction:', error);
    }
  };


  const handleAssign = (submission: any) => {
    setSelectedSubmission(submission);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (reviewerIds: string[]) => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch('/api/admin/submissions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId: selectedSubmission.id,
          reviewerIds,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsAssignModalOpen(false);
        // Optionally, show a success message
      } else {
        console.error('Failed to assign reviewers:', result.error);
      }
    } catch (error) {
      console.error('Error in handleAssignSubmit:', error);
    }
  };

  const handleForceAction = (submission: any, action: 'Approve' | 'Reject') => {
    setSelectedSubmission(submission);
    setModalAction(action);
    setIsReasonModalOpen(true);
  };

  const handleReasonSubmit = async (reason: string) => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch('/api/admin/submissions/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          status: modalAction === 'Approve' ? 'APPROVED' : 'REJECTED',
          reason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsReasonModalOpen(false);
        // Refetch submissions to update the list
        const fetchSubmissions = async () => {
          const res = await fetch('/api/admin/submissions');
          const data = await res.json();
          if (data.success) setSubmissions(data.data);
        };
        fetchSubmissions();
      } else {
        // TODO: Show an error message to the user
        console.error('Failed to update submission status:', result.error);
      }
    } catch (error) {
      console.error('Error in handleReasonSubmit:', error);
    }
  };

  const handleViewEvidence = (submission: any) => {
    setSelectedMedia(submission.file_url);
    setIsViewerOpen(true);
  };

  const handleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Submissions Management</h1>

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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Flagged">Flagged</option>
          </select>
          <input 
            type="date" 
            className="px-4 py-2 bg-gray-800 rounded-lg" 
            onChange={e => setFilters({ ...filters, date: e.target.value })}
          />
          <select 
            className="px-4 py-2 bg-gray-800 rounded-lg" 
            onChange={e => setFilters({ ...filters, country: e.target.value })}
          >
            <option value="All">All Countries</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            {/* Add other countries as needed */}
          </select>
        </div>
        </div>
        <div>
          <div className="relative inline-block">
            <button onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)} className="px-4 py-2 bg-yellow-600 rounded-lg mr-2">Bulk Actions</button>
            {isBulkActionsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10">
                <button onClick={() => handleBulkAction('Approve')} className="block w-full text-left px-4 py-2 text-green-400 hover:bg-gray-700">Approve Selected</button>
                <button onClick={() => handleBulkAction('Reject')} className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">Reject Selected</button>
              </div>
            )}
          </div>
          <button onClick={handleSyncLeaderboard} className="px-4 py-2 bg-blue-600 rounded-lg">Sync Leaderboard</button>
        </div>
      </div>

      {/* Submissions Table */}
            <EvidenceViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaUrl={selectedMedia}
      />

      {/* Submissions Table */}
            <ReasonModal 
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        onSubmit={handleReasonSubmit}
        action={modalAction}
      />

      {/* Submissions Table */}
            <AssignReviewerModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleAssignSubmit}
        reviewers={reviewers}
      />

      {/* Submissions Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4"><input type="checkbox" onChange={() => setSelected(selected.length === submissions.length ? [] : submissions.map(s => s.id))} /></th>
              <th className="p-4">Thumbnail</th>
              <th className="p-4">User</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date (UTC)</th>
              <th className="p-4">Country</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(submission => (
              <tr key={submission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-4"><input type="checkbox" checked={selected.includes(submission.id)} onChange={() => handleSelect(submission.id)} /></td>
                <td className="p-4"><img src={submission.thumbnail || '/placeholder.png'} alt="thumbnail" className="w-16 h-16 object-cover rounded-lg" /></td>
                <td className="p-4"><a href={`/admin/users/${submission.user?.id}`} className="hover:underline">{submission.user?.handle || 'N/A'}</a></td>
                <td className="p-4">{submission.status}</td>
                <td className="p-4">{new Date(submission.created_at).toLocaleString()}</td>
                <td className="p-4">{submission.user?.country_code || 'N/A'}</td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleViewEvidence(submission)} className="text-blue-400 hover:underline">View</button>
                    <button onClick={() => handleForceAction(submission, 'Approve')} className="text-green-400 hover:underline">Approve</button>
                    <button onClick={() => handleForceAction(submission, 'Reject')} className="text-red-400 hover:underline">Reject</button>
                    <button onClick={() => handleAssign(submission)} className="text-yellow-400 hover:underline">Assign</button>
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
