'use client';

interface Vote {
  id: string;
  timestamp: string;
  result: 'Correct' | 'Wrong';
  ipHash: string;
}

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: string;
  votes: Vote[];
}

const AuditDrawer = ({ isOpen, onClose, wallet, votes }: AuditDrawerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-lg h-full bg-gray-900 text-white p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Audit Trail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <p className="text-gray-400 mb-6">Showing last 20 votes for <span className="font-mono">{wallet}</span></p>

        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3">Vote ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Result</th>
              <th className="p-3">IP Hash</th>
            </tr>
          </thead>
          <tbody>
            {votes.map(vote => (
              <tr key={vote.id} className="border-b border-gray-800">
                <td className="p-3 font-mono text-sm">{vote.id}</td>
                <td className="p-3 text-sm">{vote.timestamp}</td>
                <td className="p-3">
                  <span className={`text-sm ${vote.result === 'Correct' ? 'text-green-400' : 'text-red-400'}`}>
                    {vote.result}
                  </span>
                </td>
                <td className="p-3 font-mono text-sm">{vote.ipHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditDrawer;
