'use client';

import { useState, useEffect } from 'react';

export default function BurnTrackerPage() {
  const [burnHistory, setBurnHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBurnHistory = async () => {
      try {
        // Assuming the endpoint is something like this, adjust if needed
        const response = await fetch('/api/treasury/burn-history');
        const result = await response.json();
        if (result.success) {
          setBurnHistory(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch burn history:', error);
      }
      setLoading(false);
    };

    fetchBurnHistory();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Burn Tracker</h1>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Source</th>
              <th className="p-4">Amount (GoalCoin)</th>
              <th className="p-4">Transaction Hash</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-500">Loading...</td>
              </tr>
            ) : burnHistory.length > 0 ? (
              burnHistory.map(burn => (
                <tr key={burn.id} className="border-b border-gray-800">
                  <td className="p-4">{burn.source}</td>
                  <td className="p-4">{burn.amount_goalcoin.toFixed(2)}</td>
                  <td className="p-4 font-mono">
                    {burn.tx_hash ? (
                      <a href={`https://polygonscan.com/tx/${burn.tx_hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                        {burn.tx_hash.substring(0, 10)}...
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td className="p-4">{new Date(burn.created_at).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-500">No burn events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
