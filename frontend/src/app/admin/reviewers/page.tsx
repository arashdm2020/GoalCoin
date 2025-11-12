'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCountryName } from '@/utils/countries';
import AddReviewerModal from '../../../components/AddReviewerModal';
import Tooltip from '../../../components/Tooltip';
import AuditDrawer from '../../../components/AuditDrawer';
import RangeSlider from '../../../components/RangeSlider';
import Pagination from '@/components/admin/Pagination';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<any>(null);
  const [auditVotes, setAuditVotes] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: 'All', accuracyMin: 0, accuracyMax: 1, date: '', country: 'All' });
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCountries = useCallback(async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        console.log('No auth header found');
        return;
      }
      
      console.log('Fetching countries from:', `${getBackendUrl()}/api/admin/countries`);
      const response = await fetch(`${getBackendUrl()}/api/admin/countries`, {
        headers: { 'Authorization': authHeader }
      });
      
      console.log('Countries response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch countries:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      console.log('Countries result:', result);
      
      if (result.success) {
        console.log('Setting countries:', result.data);
        setAvailableCountries(result.data || []);
      } else {
        console.error('Countries API returned error:', result);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  }, []);

  const fetchReviewers = useCallback(async () => {
    const params = new URLSearchParams({
      status: filters.status,
      accuracyMin: filters.accuracyMin.toString(),
      accuracyMax: filters.accuracyMax.toString(),
      date: filters.date,
      country: filters.country,
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    }).toString();

    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers?${params}`, {
        headers: { 'Authorization': authHeader }
      });
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setReviewers([]);
        setTotalItems(0);
        return;
      }
      
      const result = await response.json();
      console.log('Reviewers result:', result);
      
      if (result.success) {
        console.log('Setting reviewers:', result.data?.length, 'total:', result.total);
        setReviewers(result.data || []);
        setTotalItems(result.total || 0);
      } else {
        console.error('API returned error:', result);
        setReviewers([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
      setReviewers([]);
      setTotalItems(0);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCountries();
    fetchReviewers();
  }, [fetchReviewers, fetchCountries]);

  const handleApiCall = async (url: string, method: string, body: object) => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return false;
      const response = await fetch(`${getBackendUrl()}${url}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
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
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers/${reviewer.id}/audit`, {
        headers: { 'Authorization': authHeader }
      });
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white text-glow mb-6 md:mb-8">Reviewer Management</h1>

      {/* Filters and Actions */}
      <div className="flex flex-col space-y-4 mb-6 bg-gray-900 p-4 rounded-lg">
        {/* Filters Row */}
        <div className="flex flex-col space-y-3">
          <span className="text-gray-400 text-sm font-medium">Filters:</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0"
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0"
              onChange={e => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="All">All Countries</option>
              {availableCountries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <input 
              type="date" 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0" 
              onChange={e => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-gray-400 text-sm">Accuracy Range:</span>
            <div className="px-2">
              <RangeSlider 
                min={0} 
                max={1} 
                step={0.01} 
                onChange={({ min, max }) => setFilters({ ...filters, accuracyMin: min, accuracyMax: max })}
              />
            </div>
          </div>
        </div>
        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Add Reviewer</button>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Export CSV</button>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2 md:p-4 text-xs md:text-sm">Wallet</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Country</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Weight</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">
                  <Tooltip content="accuracy = 1 - wrong/total">
                    Accuracy
                  </Tooltip>
                </th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Strikes</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Status</th>
                <th className="p-2 md:p-4 text-xs md:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-lg">No reviewers found</p>
                      <p className="text-sm">Use the "Add Reviewer" button to add a new reviewer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviewers.map(reviewer => (
                  <tr key={reviewer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 md:p-4">
                      <div className="font-mono text-xs md:text-sm break-all">
                        {reviewer.user?.wallet ? `${reviewer.user.wallet.slice(0, 6)}...${reviewer.user.wallet.slice(-4)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">
                      <div className="flex items-center gap-1">
                        <span>{reviewer.user?.country_code || 'N/A'}</span>
                        {reviewer.user?.country_code && (
                          <span className="text-gray-400 text-xs">
                            ({getCountryName(reviewer.user.country_code)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">{reviewer.voting_weight}x</td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">
                      <Tooltip content={`Votes: ${reviewer.total_votes} | Wrong: ${reviewer.wrong_votes}`}>
                        {(reviewer.accuracy * 100).toFixed(2)}%
                      </Tooltip>
                    </td>
                    <td className="p-2 md:p-4 text-xs md:text-sm">{reviewer.strikes}</td>
                    <td className="p-2 md:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${reviewer.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {reviewer.status}
                      </span>
                    </td>
                    <td className="p-2 md:p-4">
                      <div className="flex flex-col md:flex-row gap-1 text-xs">
                        {reviewer.status === 'ACTIVE' ? (
                          <button onClick={() => handleStatusChange(reviewer.id, 'SUSPENDED')} className="text-yellow-400 hover:underline">Suspend</button>
                        ) : (
                          <button onClick={() => handleStatusChange(reviewer.id, 'ACTIVE')} className="text-green-400 hover:underline">Reinstate</button>
                        )}
                        <button onClick={() => handleResetStrikes(reviewer.id)} className="text-blue-400 hover:underline">Reset</button>
                        <button onClick={() => handleRemove(reviewer.id)} className="text-red-400 hover:underline">Remove</button>
                        <button onClick={() => handleViewAudit(reviewer)} className="text-gray-400 hover:underline">Audit</button>
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
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  );
}