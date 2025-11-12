'use client';

import { useState } from 'react';
import EvidenceViewer from '../../../components/EvidenceViewer';
import ReasonModal from '../../../components/ReasonModal';
import AssignReviewerModal from '../../../components/AssignReviewerModal';

// Mock data for demonstration
const mockSubmissions = [
  { id: 1, user: 'user_a', thumbnail: '/placeholder.png', status: 'Pending', date: '2025-11-12T10:00:00Z', country: 'US' },
  { id: 2, user: 'user_b', thumbnail: '/placeholder.png', status: 'Approved', date: '2025-11-11T15:30:00Z', country: 'CA' },
  { id: 3, user: 'user_c', thumbnail: '/placeholder.png', status: 'Rejected', date: '2025-11-11T12:00:00Z', country: 'GB' },
  { id: 4, user: 'user_d', thumbnail: '/placeholder.png', status: 'Flagged', date: '2025-11-10T09:00:00Z', country: 'AU' },
];

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState(mockSubmissions);
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
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  const handleBulkAction = (action: 'Approve' | 'Reject') => {
    console.log(`Performing bulk ${action} on submissions: ${selected.join(', ')}`);
    // Here you would typically make an API call
    const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';
    setSubmissions(submissions.map(s => 
      selected.includes(s.id) ? { ...s, status: newStatus } : s
    ));
    setSelected([]);
    setIsBulkActionsOpen(false);
  };

  // Mock reviewers for the assignment modal
  const mockReviewers = [
    { id: 1, wallet: '0x123...abc' },
    { id: 2, wallet: '0x456...def' },
    { id: 3, wallet: '0x789...ghi' },
  ];

  const handleAssign = (submission: any) => {
    setSelectedSubmission(submission);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (reviewerIds: number[]) => {
    console.log(`Assigning submission ${selectedSubmission.id} to reviewers: ${reviewerIds.join(', ')}`);
    // Here you would typically make an API call
  };

  const handleForceAction = (submission: any, action: 'Approve' | 'Reject') => {
    setSelectedSubmission(submission);
    setModalAction(action);
    setIsReasonModalOpen(true);
  };

  const handleReasonSubmit = (reason: string) => {
    console.log(`Forcing ${modalAction} for submission ${selectedSubmission.id} with reason: ${reason}`);
    // Here you would typically make an API call
    setSubmissions(submissions.map(s => 
      s.id === selectedSubmission.id ? { ...s, status: modalAction === 'Approve' ? 'Approved' : 'Rejected' } : s
    ));
  };

  const handleViewEvidence = (mediaUrl: string) => {
    setSelectedMedia(mediaUrl);
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
          <button className="px-4 py-2 bg-blue-600 rounded-lg">Sync Leaderboard</button>
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
        reviewers={mockReviewers}
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
                <td className="p-4"><img src={submission.thumbnail} alt="thumbnail" className="w-16 h-16 object-cover rounded-lg" /></td>
                <td className="p-4"><a href="#" className="hover:underline">{submission.user}</a></td>
                <td className="p-4">{submission.status}</td>
                <td className="p-4">{new Date(submission.date).toLocaleString()}</td>
                <td className="p-4">{submission.country}</td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button onClick={() => handleViewEvidence(submission.thumbnail)} className="text-blue-400 hover:underline">View</button>
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
