'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCountryName } from '@/utils/countries';
import Pagination from '@/components/admin/Pagination';

const TABS = ['Global', 'Country', 'Sport', 'Fans', 'Players', 'Reviewers'];

const LeaderboardRow = ({ user, rank, router }: { user: any; rank: number; router: any }) => {
  let rankColor = '';
  if (rank === 1) rankColor = 'text-yellow-400';
  if (rank === 2) rankColor = 'text-gray-300';
  if (rank === 3) rankColor = 'text-yellow-600';

  const handleUserClick = () => {
    router.push(`/admin/users/${user.id}`);
  };

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/50 ${rank <= 3 ? 'font-bold' : ''}`}>
      <td className={`p-2 text-sm ${rankColor}`}>{rank}</td>
      <td className="p-2 text-sm">
        <button 
          onClick={handleUserClick}
          className="hover:underline text-blue-400 cursor-pointer"
        >
          {user.handle || 'N/A'}
        </button>
      </td>
      <td className="p-2 text-sm">
        <div className="flex items-center gap-2">
          {user.country_code ? (
            <>
              <img 
                src={`https://flagsapi.com/${user.country_code}/flat/32.png`}
                alt={user.country_code}
                className="w-6 h-4 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span>{user.country_code}</span>
              <span className="text-gray-400 text-xs">
                ({getCountryName(user.country_code)})
              </span>
            </>
          ) : (
            <span>N/A</span>
          )}
        </div>
      </td>
      <td className="p-2 text-sm font-bold text-yellow-500">{user.goal_points}</td>
      <td className="p-2 text-sm">{user.xp_points}</td>
    </tr>
  );
};

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ country: 'All', sport: 'All', dateRange: '' });
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [isRecomputing, setIsRecomputing] = useState(false);

  const fetchCountries = useCallback(async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      
      const response = await fetch(`${getBackendUrl()}/api/admin/countries`, {
        headers: { 'Authorization': authHeader }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch countries:', response.status);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setAvailableCountries(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      // Fallback countries
      setAvailableCountries([
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' }
      ]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      type: activeTab.toLowerCase(),
      country: filters.country === 'All' ? '' : filters.country,
      sport: filters.sport === 'All' ? '' : filters.sport,
      dateRange: filters.dateRange,
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    }).toString();

    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;
      const response = await fetch(`${getBackendUrl()}/api/admin/leaderboard?${params}`, { headers: { 'Authorization': authHeader } });
      const result = await response.json();
      if (result.success) {
        setLeaderboardData(result.data || []);
        setTotalItems(result.total || 0);
      } else {
        setLeaderboardData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboardData([]);
      setTotalItems(0);
    }
  }, [activeTab, filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCountries();
    fetchData();
  }, [fetchData, fetchCountries]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleRecompute = async () => {
    if (isRecomputing) return;
    
    setIsRecomputing(true);
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        setIsRecomputing(false);
        return;
      }
      
      const response = await fetch(`${getBackendUrl()}/api/admin/leaderboard/recalculate`, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader } 
      });
      
      const result = await response.json();
      if (result.success) {
        alert('✅ Leaderboard recalculation triggered! Refreshing data...');
        await fetchData(); // Refresh data immediately
        alert('✅ Leaderboard updated successfully!');
      } else {
        alert(`❌ Error: ${result.error || 'Failed to recompute'}`);
      }
    } catch (error) {
      console.error('Failed to recompute leaderboard:', error);
      alert('❌ Failed to recompute leaderboard. Please try again.');
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        alert('Authentication required');
        return;
      }

      // Determine export type based on active tab
      let exportType = 'leaderboard';
      if (activeTab === 'Country') exportType = 'leaderboard-country';
      else if (activeTab === 'Sport') exportType = 'leaderboard-sport';
      else if (activeTab === 'Fans') exportType = 'leaderboard-fans';
      else if (activeTab === 'Players') exportType = 'leaderboard-players';
      else if (activeTab === 'Reviewers') exportType = 'leaderboard-reviewers';

      const response = await fetch(`${getBackendUrl()}/api/admin/export-csv?type=${exportType}`, {
        method: 'GET',
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      // Get the CSV content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('✅ CSV exported successfully!');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('❌ Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white text-glow mb-4 md:mb-8">Leaderboard Management</h1>

      {/* Tabs and Filters */}
      <div className="flex flex-col gap-4 mb-6 bg-gray-900 p-4 rounded-lg">
        {/* Tabs - Scrollable on mobile */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select className="px-4 py-2 bg-gray-800 rounded-lg text-sm flex-1" onChange={e => setFilters({...filters, country: e.target.value})}>
            <option value="All">All Countries</option>
            {availableCountries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
          <select className="px-4 py-2 bg-gray-800 rounded-lg text-sm flex-1" onChange={e => setFilters({...filters, sport: e.target.value})}>
            <option value="All">All Sports</option>
            {/* TODO: Populate with actual sports */}
          </select>
          <input type="date" className="px-4 py-2 bg-gray-800 rounded-lg text-sm flex-1" onChange={e => setFilters({...filters, dateRange: e.target.value})}/>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={handleRecompute} 
            disabled={isRecomputing}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecomputing ? 'Recomputing...' : 'Recompute'}
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 text-sm whitespace-nowrap"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="bg-gray-900 rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2 text-sm w-16">Rank</th>
              <th className="p-2 text-sm">User</th>
              <th className="p-2 text-sm">Country</th>
              <th className="p-2 text-sm">Goal Points</th>
              <th className="p-2 text-sm">XP Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.length > 0 ? (
              leaderboardData.map((user, index) => (
                <LeaderboardRow key={user.id || index} user={user} rank={(currentPage - 1) * itemsPerPage + index + 1} router={router} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-16 text-gray-500">No data available for this view.</td>
              </tr>
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
    </div>
  );
}
