'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCountryName } from '@/utils/countries';
import AddReviewerModal from '../../../components/AddReviewerModal';
import Tooltip from '../../../components/Tooltip';
import AuditDrawer from '../../../components/AuditDrawer';
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
      // Fallback: Set some default countries if API fails
      setAvailableCountries([
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' }
      ]);
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
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ wallet }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Reviewer added successfully');
        fetchReviewers(); // Refresh the list
        setIsModalOpen(false);
      } else {
        alert('Failed to add reviewer: ' + (result.error || 'Unknown error'));
        throw new Error(result.error || 'Failed to add reviewer');
      }
    } catch (error) {
      console.error('Failed to add reviewer:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleStatusChange = async (reviewerId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ reviewerId, status }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Reviewer ${status.toLowerCase()} successfully`);
        fetchReviewers(); // Refresh the list
      } else {
        alert('Failed to update reviewer status: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update reviewer status:', error);
      alert('Failed to update reviewer status. Please try again.');
    }
  };

  const handleResetStrikes = async (reviewerId: string) => {
    if (!confirm('Are you sure you want to reset strikes for this reviewer?')) {
      return;
    }
    
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers/reset-strikes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ reviewerId }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Reviewer strikes reset successfully');
        fetchReviewers(); // Refresh the list
      } else {
        alert('Failed to reset strikes: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to reset strikes:', error);
      alert('Failed to reset strikes. Please try again.');
    }
  };

  const handleRemove = async (reviewerId: string) => {
    if (!confirm('Are you sure you want to remove this reviewer? This action cannot be undone.')) {
      return;
    }
    
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers/remove`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ reviewerId }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Reviewer removed successfully');
        fetchReviewers(); // Refresh the list
      } else {
        alert('Failed to remove reviewer: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to remove reviewer:', error);
      alert('Failed to remove reviewer. Please try again.');
    }
  };

  const handleViewAudit = async (reviewer: any) => {
    setSelectedReviewer(reviewer);
    setIsDrawerOpen(true);
    
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        setAuditVotes([]);
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/reviewers/${reviewer.id}/audit`, {
        headers: { 'Authorization': authHeader }
      });
      
      const result = await response.json();
      if (result.success) {
        setAuditVotes(result.data || []);
      } else {
        console.error('Failed to fetch audit data:', result.error);
        setAuditVotes([]);
        alert('Failed to load audit data: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setAuditVotes([]);
      alert('Failed to load audit data. Please try again.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/export-csv?type=reviewers`, {
        headers: { 'Authorization': authHeader }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviewers-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export CSV. Please try again.');
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
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
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select 
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm flex-1 min-w-0"
              value={filters.country}
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
              value={filters.date}
              onChange={e => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-gray-400 text-sm">Accuracy Range:</span>
            <div className="flex items-center gap-4 px-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Min:</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={Math.round(filters.accuracyMin * 100)}
                  onChange={e => setFilters({...filters, accuracyMin: parseInt(e.target.value) / 100})}
                  className="w-16 px-2 py-1 bg-gray-800 rounded text-sm"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Max:</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={Math.round(filters.accuracyMax * 100)}
                  onChange={e => setFilters({...filters, accuracyMax: parseInt(e.target.value) / 100})}
                  className="w-16 px-2 py-1 bg-gray-800 rounded text-sm"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <button 
                onClick={() => setFilters({...filters, accuracyMin: 0, accuracyMax: 1})}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <span className="text-gray-400 text-sm font-medium">Actions:</span>
          <div className="flex gap-3">
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Add Reviewer</button>
            <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Export CSV</button>
          </div>
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
                <th className="p-2 text-sm">Wallet</th>
                <th className="p-2 text-sm">Country</th>
                <th className="p-2 text-sm">Weight</th>
                <th className="p-2 text-sm">
                  <Tooltip content="accuracy = 1 - wrong/total">
                    Accuracy
                  </Tooltip>
                </th>
                <th className="p-2 text-sm">Strikes</th>
                <th className="p-2 text-sm">Status</th>
                <th className="p-2 text-sm">Actions</th>
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
                    <td className="p-2">
                      <div className="font-mono text-sm break-all">
                        {reviewer.user?.wallet ? `${reviewer.user.wallet.slice(0, 6)}...${reviewer.user.wallet.slice(-4)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="p-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span>{reviewer.user?.country_code || 'N/A'}</span>
                        {reviewer.user?.country_code && (
                          <span className="text-gray-400 text-xs">
                            ({getCountryName(reviewer.user.country_code)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-sm">{reviewer.voting_weight}x</td>
                    <td className="p-2 text-sm">
                      <Tooltip content={`Votes: ${reviewer.total_votes} | Wrong: ${reviewer.wrong_votes}`}>
                        {(reviewer.accuracy * 100).toFixed(2)}%
                      </Tooltip>
                    </td>
                    <td className="p-2 text-sm">{reviewer.strikes}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${reviewer.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {reviewer.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col sm:flex-row flex-wrap gap-1 min-w-[140px]">
                        {reviewer.status === 'ACTIVE' ? (
                          <button 
                            onClick={() => handleStatusChange(reviewer.id, 'SUSPENDED')} 
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs text-white whitespace-nowrap"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(reviewer.id, 'ACTIVE')} 
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white whitespace-nowrap"
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          onClick={() => handleResetStrikes(reviewer.id)} 
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white whitespace-nowrap"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => handleRemove(reviewer.id)} 
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white whitespace-nowrap"
                        >
                          Remove
                        </button>
                        <button 
                          onClick={() => handleViewAudit(reviewer)} 
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-white whitespace-nowrap"
                        >
                          Audit
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