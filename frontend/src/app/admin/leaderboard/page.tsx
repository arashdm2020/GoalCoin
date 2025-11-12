'use client';

import { useState, useEffect, useCallback } from 'react';

const TABS = ['Global', 'Country', 'Sport', 'Fans', 'Players', 'Reviewers'];

const LeaderboardRow = ({ user, rank }: { user: any; rank: number }) => {
  let rankColor = '';
  if (rank === 1) rankColor = 'text-yellow-400';
  if (rank === 2) rankColor = 'text-gray-300';
  if (rank === 3) rankColor = 'text-yellow-600';

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/50 ${rank <= 3 ? 'font-bold' : ''}`}>
      <td className={`p-4 ${rankColor}`}>{rank}</td>
      <td className="p-4"><a href={`/admin/users/${user.id}`} className="hover:underline text-blue-400">{user.handle || 'N/A'}</a></td>
      <td className="p-4">{user.country_code || 'N/A'}</td>
      <td className="p-4 font-bold text-yellow-500">{user.goal_points}</td>
      <td className="p-4">{user.xp_points}</td>
    </tr>
  );
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ country: 'All', sport: 'All', dateRange: '' });

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      type: activeTab.toLowerCase(),
      country: filters.country === 'All' ? '' : filters.country,
      sport: filters.sport === 'All' ? '' : filters.sport,
      dateRange: filters.dateRange,
    }).toString();

    try {
      const response = await fetch(`/api/admin/leaderboard?${params}`);
      const result = await response.json();
      if (result.success) {
        setLeaderboardData(result.data || []);
      } else {
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboardData([]);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecompute = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard/recalculate', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Leaderboard recalculation triggered! Data will refresh shortly.');
        setTimeout(fetchData, 3000); // Refresh data after a delay
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to recompute leaderboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Leaderboard Management</h1>

      {/* Tabs and Filters */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 bg-gray-800 rounded-lg" onChange={e => setFilters({...filters, country: e.target.value})}>
            <option value="All">All Countries</option>
            {/* TODO: Populate with actual countries from an API */}
            <option value="US">United States</option>
            <option value="CA">Canada</option>
          </select>
          <select className="px-4 py-2 bg-gray-800 rounded-lg" onChange={e => setFilters({...filters, sport: e.target.value})}>
            <option value="All">All Sports</option>
            {/* TODO: Populate with actual sports */}
          </select>
          <input type="date" className="px-4 py-2 bg-gray-800 rounded-lg" onChange={e => setFilters({...filters, dateRange: e.target.value})}/>
          <button onClick={handleRecompute} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500">Recompute</button>
          <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">Export CSV</button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4 w-16">Rank</th>
              <th className="p-4">User</th>
              <th className="p-4">Country</th>
              <th className="p-4">Goal Points</th>
              <th className="p-4">XP Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.length > 0 ? (
              leaderboardData.map((user, index) => (
                <LeaderboardRow key={user.id || index} user={user} rank={index + 1} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-16 text-gray-500">No data available for this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
