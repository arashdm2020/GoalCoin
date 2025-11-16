'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCountryName } from '@/utils/countries';
import EvidenceViewer from '../../../components/EvidenceViewer';
import ReasonModal from '../../../components/ReasonModal';
import AssignReviewerModal from '../../../components/AssignReviewerModal';
import Pagination from '@/components/admin/Pagination';
import { useToast } from '../../../hooks/useToastNotification';


const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function SubmissionsPage() {
  const { showSuccess, showError, ToastComponent } = useToast();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({ status: 'All', date: '', country: 'All' });

  const fetchSubmissions = useCallback(async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      
      // Build query parameters for pagination and filtering
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (filters.status !== 'All') {
        params.append('status', filters.status);
      }
      if (filters.country !== 'All') {
        params.append('country', filters.country);
      }
      if (filters.date) {
        params.append('date', filters.date);
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions?${params.toString()}`, { 
        headers: { 'Authorization': authHeader } 
      });
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setSubmissions([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setSubmissions(result.data || []);
        setTotalItems(result.total || 0);
      } else {
        console.error('API returned error:', result);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    }
  }, [currentPage, itemsPerPage, filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'Approve' | 'Reject'>('Approve');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  // Remove client-side filtering since we're doing server-side pagination
  const filteredSubmissions = submissions;
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
        showSuccess('Leaderboard recalculation triggered');
      } else {
        console.error('Failed to sync leaderboard:', result.error);
      }
    } catch (error) {
      console.error('Error syncing leaderboard:', error);
    }
  };

  const handleBulkAction = async (action: 'Approve' | 'Reject') => {
    if (selected.length === 0) {
      showError('Please select at least one submission');
      return;
    }

    if (!confirm(`Are you sure you want to ${action.toLowerCase()} ${selected.length} submission(s)?`)) {
      return;
    }

    const newStatus = action === 'Approve' ? 'APPROVED' : 'REJECTED';

    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        showError('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ submissionIds: selected, status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(`${selected.length} submission(s) ${action.toLowerCase()}d successfully`);
        setSelected([]);
        setIsBulkActionsOpen(false);
        fetchSubmissions(); // Refetch submissions to update the list
      } else {
        showError('Failed to approve submission: ' + (result.error || 'Unknown error'));
        console.error('Failed to perform bulk action:', result.error);
      }
    } catch (error) {
      console.error('Error in handleBulkAction:', error);
      showError('Failed to approve submission. Please try again');
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
      if (!authHeader) {
        showError('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/submissions/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ 
          submission_id: selectedSubmission.id, // Backend expects submission_id not submissionId
          reviewerIds,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Submission assigned successfully to reviewer');
        setIsAssignModalOpen(false);
        setSelectedSubmission(null);
        fetchSubmissions(); // Refresh to show updated assignments
      } else {
        showError('Failed to assign reviewers: ' + (result.error || 'Unknown error'));
        console.error('Failed to assign reviewers:', result.error);
      }
    } catch (error) {
      console.error('Error in handleAssignSubmit:', error);
      showError('Failed to assign reviewers. Please try again');
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
      if (!authHeader) {
        showError('Authentication required');
        return;
      }
      
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
        const newStatus = modalAction === 'Approve' ? 'Approved' : 'Rejected';
        showSuccess(`Submission ${modalAction.toLowerCase()}d successfully`);
        setIsReasonModalOpen(false);
        setSelectedSubmission(null);
        // Update filter to show the new status
        setFilters({ ...filters, status: newStatus });
        setCurrentPage(1); // Reset to first page
      } else {
        showError('Failed to update submission status: ' + (result.error || 'Unknown error'));
        console.error('Failed to update submission status:', result.error);
      }
    } catch (error) {
      console.error('Error in handleReasonSubmit:', error);
      showError('Failed to update submission status. Please try again');
    }
  };

  const handleViewEvidence = (submission: any) => {
    if (!submission.file_url) {
      showError('No evidence file available for this submission');
      return;
    }
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
                <th className="p-2 text-sm"><input type="checkbox" onChange={() => setSelected(selected.length === submissions.length ? [] : submissions.map(s => s.id))} /></th>
                <th className="p-2 text-sm">Thumbnail</th>
                <th className="p-2 text-sm">User</th>
                <th className="p-2 text-sm">Status</th>
                <th className="p-2 text-sm">Date</th>
                <th className="p-2 text-sm">Country</th>
                <th className="p-2 text-sm">Actions</th>
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
                    <td className="p-2"><input type="checkbox" checked={selected.includes(submission.id)} onChange={() => handleSelect(submission.id)} /></td>
                    <td className="p-2">
                      <img 
                        src={submission.file_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E'} 
                        alt="thumbnail" 
                        className="w-10 h-10 object-cover rounded-lg" 
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </td>
                    <td className="p-2 text-sm">
                      <button 
                        onClick={() => router.push(`/admin/users/${submission.user?.id}`)}
                        className="hover:underline text-blue-400 cursor-pointer"
                      >
                        {submission.user?.handle || 'N/A'}
                      </button>
                    </td>
                    <td className="p-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.status === 'APPROVED' ? 'bg-green-600' : 
                        submission.status === 'REJECTED' ? 'bg-red-600' : 
                        submission.status === 'PENDING' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm">{new Date(submission.created_at).toLocaleDateString()}</td>
                    <td className="p-2 text-sm">
                      <div className="flex items-center gap-2">
                        {submission.user?.country_code ? (
                          <>
                            <img 
                              src={`https://flagsapi.com/${submission.user.country_code}/flat/32.png`}
                              alt={submission.user.country_code}
                              className="w-6 h-4 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span>{submission.user.country_code}</span>
                            <span className="text-gray-400 text-xs">
                              ({getCountryName(submission.user.country_code)})
                            </span>
                          </>
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col sm:flex-row flex-wrap gap-1 min-w-[120px]">
                        {/* View button - always enabled */}
                        <button 
                          onClick={() => handleViewEvidence(submission)} 
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white whitespace-nowrap"
                        >
                          View
                        </button>
                        
                        {/* Approve button - only enabled for PENDING submissions */}
                        <button 
                          onClick={() => handleForceAction(submission, 'Approve')} 
                          disabled={submission.status !== 'PENDING'}
                          className={`px-2 py-1 rounded text-xs text-white whitespace-nowrap ${
                            submission.status === 'PENDING' 
                              ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                              : 'bg-gray-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Approve
                        </button>
                        
                        {/* Reject button - only enabled for PENDING submissions */}
                        <button 
                          onClick={() => handleForceAction(submission, 'Reject')} 
                          disabled={submission.status !== 'PENDING'}
                          className={`px-2 py-1 rounded text-xs text-white whitespace-nowrap ${
                            submission.status === 'PENDING' 
                              ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
                              : 'bg-gray-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Reject
                        </button>
                        
                        {/* Assign button - only enabled for PENDING submissions */}
                        <button 
                          onClick={() => handleAssign(submission)} 
                          disabled={submission.status !== 'PENDING'}
                          className={`px-2 py-1 rounded text-xs text-white whitespace-nowrap ${
                            submission.status === 'PENDING' 
                              ? 'bg-yellow-600 hover:bg-yellow-700 cursor-pointer' 
                              : 'bg-gray-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        )}
      </div>

      {ToastComponent}
    </div>
  );
}
