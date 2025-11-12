'use client';

import { useState } from 'react';

// Mock data for demonstration
const mockBurnHistory = [
  { id: 1, sport: 'Running', finisher: 'user_a', points: 100, computedBurn: 10, status: 'Verified', source: 'Manual' },
  { id: 2, sport: 'Cycling', finisher: 'user_b', points: 200, computedBurn: 20, status: 'Pending', source: 'API' },
  { id: 3, sport: 'Swimming', finisher: 'user_c', points: 150, computedBurn: 15, status: 'Pending', source: 'API' },
];

export default function BurnTrackerPage() {
  const [burnHistory, setBurnHistory] = useState(mockBurnHistory);

  const handleVerify = (id: number) => {
    setBurnHistory(burnHistory.map(item => 
      item.id === id ? { ...item, status: 'Verified' } : item
    ));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Burn Tracker (Admin View)</h1>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Sport</th>
              <th className="p-4">Finisher</th>
              <th className="p-4">Points</th>
              <th className="p-4">Computed Burn</th>
              <th className="p-4">Status</th>
              <th className="p-4">Source</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {burnHistory.map(item => (
              <tr key={item.id} className="border-b border-gray-800">
                <td className="p-4">{item.sport}</td>
                <td className="p-4">{item.finisher}</td>
                <td className="p-4">{item.points}</td>
                <td className="p-4">{item.computedBurn}</td>
                <td className="p-4">{item.status}</td>
                <td className="p-4">{item.source}</td>
                <td className="p-4">
                  {item.status === 'Pending' && (
                    <button onClick={() => handleVerify(item.id)} className="px-3 py-1 bg-green-600 rounded-lg">Mark Verified (DAO)</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
