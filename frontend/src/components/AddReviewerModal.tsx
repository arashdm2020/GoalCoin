'use client';

import { useState } from 'react';

interface AddReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReviewer: (wallet: string) => void;
}

const AddReviewerModal = ({ isOpen, onClose, onAddReviewer }: AddReviewerModalProps) => {
  const [wallet, setWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isValidWallet = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!wallet.trim()) {
      setError('Wallet address is required');
      return;
    }
    
    if (!isValidWallet(wallet.trim())) {
      setError('Invalid wallet address format');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAddReviewer(wallet.trim());
      setWallet('');
      onClose();
    } catch (error) {
      setError('Failed to add reviewer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setWallet('');
    setError('');
    setIsLoading(false);
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
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] mb-2"
          disabled={isLoading}
        />
        
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex justify-end mt-6">
          <button 
            onClick={handleClose} 
            className="px-4 py-2 bg-gray-700 rounded-lg mr-2 hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !wallet.trim()}
          >
            {isLoading ? 'Adding...' : 'Add Reviewer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReviewerModal;
