'use client';

import { useState, useEffect } from 'react';
import EvidenceViewer from '../../../components/EvidenceViewer';
import ReasonModal from '../../../components/ReasonModal';
import AssignReviewerModal from '../../../components/AssignReviewerModal';


const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // TODO: Add proper filtering and pagination
        const authHeader = localStorage.getItem('admin_auth_header');
        if (!authHeader) return;
        const response = await fetch(`${getBackendUrl()}/api/admin/submissions`, { headers: { 'Authorization': authHeader } });
        
        if (!response.ok) {
          console.error('API Error:', response.status, response.statusText);
          setSubmissions([]);
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          setSubmissions(result.data || []);
        } else {
          console.error('API returned error:', result);
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
        setSubmissions([]);
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
        const authHeader = localStorage.getItem('admin_auth_header');
        if (!authHeader) return;
        const response = await fetch(`${getBackendUrl()}/api/admin/reviewers?status=ACTIVE`, { headers: { 'Authorization': authHeader } });
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
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/leaderboard/recalculate`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
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
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
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
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
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
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
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
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white text-glow mb-6 md:mb-8">Submissions Management</h1>

      {/* Filters and Actions */}
      <div className="flex flex-col space-y-4 mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex flex-col space-y-3">
          <span className="text-gray-400 text-sm font-medium">Filters:</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0" 
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
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0" 
              onChange={e => setFilters({ ...filters, date: e.target.value })}
            />
            <select 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0" 
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
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2 md:p-4 text-xs md:text-sm"><input type="checkbox" onChange={() => setSelected(selected.length === submissions.length ? [] : submissions.map(s => s.id))} /></th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Thumbnail</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">User</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Status</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Date</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Country</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-lg">No submissions found</p>
                      <p className="text-sm">No submissions have been submitted to the system or none match your current filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map(submission => (
                  <tr key={submission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 md:p-4"><input type="checkbox" checked={selected.includes(submission.id)} onChange={() => handleSelect(submission.id)} /></td>
                    <td className="p-2 md:p-4">
                      <img src={submission.thumbnail || '/placeholder.png'} alt="thumbnail" className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg" />
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm"><a href={`/admin/users/${submission.user?.id}`} className="hover:underline">{submission.user?.handle || 'N/A'}</a></td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">{submission.status}</td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">{new Date(submission.created_at).toLocaleDateString()}</td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">{submission.user?.country_code || 'N/A'}</td>
                    <td className="p-2 md:p-4">
                      <div className="flex flex-col md:flex-row gap-1 text-xs">
                        <button onClick={() => handleViewEvidence(submission)} className="text-blue-400 hover:underline">View</button>
                        <button onClick={() => handleForceAction(submission, 'Approve')} className="text-green-400 hover:underline">Approve</button>
                        <button onClick={() => handleForceAction(submission, 'Reject')} className="text-red-400 hover:underline">Reject</button>
                        <button onClick={() => handleAssign(submission)} className="text-yellow-400 hover:underline">Assign</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
