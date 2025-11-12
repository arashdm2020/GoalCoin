'use client';

import { useState } from 'react';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  action: 'Approve' | 'Reject';
}

const ReasonModal = ({ isOpen, onClose, onSubmit, action }: ReasonModalProps) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <h2 className={`text-2xl font-bold mb-4 ${action === 'Approve' ? 'text-green-400' : 'text-red-400'}`}>
          Force {action}
        </h2>
        <p className="text-gray-400 mb-6">Please provide a reason for this action.</p>
        
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason..."
          className="w-full h-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] mb-6"
        />

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg mr-2">Cancel</button>
          <button onClick={handleSubmit} className={`px-4 py-2 rounded-lg ${action === 'Approve' ? 'bg-green-600' : 'bg-red-600'}`}>
            Confirm {action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
