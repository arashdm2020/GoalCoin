'use client';

import { useState } from 'react';

// Mock data for demonstration
const mockLeaderboard = {
  global: [
    { rank: 1, handle: 'user_a', points: 1000, country: 'US', sport: 'Running' },
    { rank: 2, handle: 'user_b', points: 950, country: 'CA', sport: 'Cycling' },
    { rank: 3, handle: 'user_c', points: 900, country: 'GB', sport: 'Swimming' },
  ],
  country: [],
  sport: [],
  fans: [],
  players: [],
  reviewers: [],
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('global');
  const [filters, setFilters] = useState({ country: 'All', sport: 'All', dateRange: '' });

  const filteredLeaderboard = mockLeaderboard[activeTab as keyof typeof mockLeaderboard].filter(entry => {
    if (filters.country !== 'All' && entry.country !== filters.country) return false;
    if (filters.sport !== 'All' && entry.sport !== filters.sport) return false;
    // Date range filtering logic will go here
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Rank', 'Handle', 'Points', 'Country', 'Sport'];
    const rows = filteredLeaderboard.map(entry => 
      [entry.rank, entry.handle, entry.points, entry.country, entry.sport].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_leaderboard.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Leaderboard Management</h1>

      {/* Filters and Actions */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Filters:</span>
          <select onChange={e => setFilters({ ...filters, country: e.target.value })} className="px-4 py-2 bg-gray-800 rounded-lg">
            <option value="All">All Countries</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
          </select>
          <select onChange={e => setFilters({ ...filters, sport: e.target.value })} className="px-4 py-2 bg-gray-800 rounded-lg">
            <option value="All">All Sports</option>
            <option value="Running">Running</option>
            <option value="Cycling">Cycling</option>
            <option value="Swimming">Swimming</option>
          </select>
          <input type="date" onChange={e => setFilters({ ...filters, dateRange: e.target.value })} className="px-4 py-2 bg-gray-800 rounded-lg" />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 rounded-lg mr-2">Recompute/Refresh</button>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 rounded-lg">Export CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button onClick={() => setActiveTab('global')} className={`px-4 py-2 ${activeTab === 'global' ? 'border-b-2 border-yellow-500' : ''}`}>Global</button>
        <button onClick={() => setActiveTab('country')} className={`px-4 py-2 ${activeTab === 'country' ? 'border-b-2 border-yellow-500' : ''}`}>Country</button>
        <button onClick={() => setActiveTab('sport')} className={`px-4 py-2 ${activeTab === 'sport' ? 'border-b-2 border-yellow-500' : ''}`}>Sport</button>
        <button onClick={() => setActiveTab('fans')} className={`px-4 py-2 ${activeTab === 'fans' ? 'border-b-2 border-yellow-500' : ''}`}>Fans</button>
        <button onClick={() => setActiveTab('players')} className={`px-4 py-2 ${activeTab === 'players' ? 'border-b-2 border-yellow-500' : ''}`}>Players</button>
        <button onClick={() => setActiveTab('reviewers')} className={`px-4 py-2 ${activeTab === 'reviewers' ? 'border-b-2 border-yellow-500' : ''}`}>Reviewers</button>
      </div>

      {/* Tab Content */}
      <div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Handle</th>
                <th className="p-4">Points</th>
                <th className="p-4">Country</th>
                <th className="p-4">Sport</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry, index) => (
                <tr key={index} className={`border-b border-gray-800 ${index < 3 ? 'font-bold' : ''}`}>
                  <td className={`p-4 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-yellow-600' : ''}`}>{entry.rank}</td>
                  <td className="p-4"><a href="#" className="hover:underline">{entry.handle}</a></td>
                  <td className="p-4">{entry.points}</td>
                  <td className="p-4">{entry.country}</td>
                  <td className="p-4">{entry.sport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
