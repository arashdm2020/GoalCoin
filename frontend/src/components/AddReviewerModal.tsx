'use client';

import { useState } from 'react';

interface AddReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReviewer: (wallet: string) => void;
}

const AddReviewerModal = ({ isOpen, onClose, onAddReviewer }: AddReviewerModalProps) => {
  const [wallet, setWallet] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAddReviewer(wallet);
    setWallet('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Reviewer</h2>
        <p className="text-gray-400 mb-6">Enter the wallet address of the new reviewer.</p>
        
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] mb-6"
        />

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg mr-2">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 rounded-lg">Add Reviewer</button>
        </div>
      </div>
    </div>
  );
};

export default AddReviewerModal;
