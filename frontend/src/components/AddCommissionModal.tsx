'use client';

import { useState } from 'react';

interface AddCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commission: { reviewer_wallet: string; submission_id: string; amount_usdt: number; reason: string; }) => void;
}

const AddCommissionModal = ({ isOpen, onClose, onSubmit }: AddCommissionModalProps) => {
  const [reviewer_wallet, setReviewerWallet] = useState('');
  const [submission_id, setSubmissionId] = useState('');
  const [amount_usdt, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ reviewer_wallet, submission_id, amount_usdt, reason });
    setReviewerWallet('');
    setSubmissionId('');
    setAmount(0);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-yellow-500/30">
        <h2 className="text-2xl font-bold mb-6 text-glow">Add Manual Commission</h2>
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={reviewer_wallet}
            onChange={(e) => setReviewerWallet(e.target.value)}
            placeholder="Reviewer Wallet Address"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
          />
          <input
            type="text"
            value={submission_id}
            onChange={(e) => setSubmissionId(e.target.value)}
            placeholder="Submission ID"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
          />
          <input
            type="number"
            value={amount_usdt}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Amount (USDT)"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24 resize-none focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors">Add Commission</button>
        </div>
      </div>
    </div>
  );
};

export default AddCommissionModal;
