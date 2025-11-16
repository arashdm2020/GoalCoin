'use client';

import { useState } from 'react';

interface Reviewer {
  id: string;
  wallet: string;
  user?: { wallet: string; handle?: string };
  total_reviews?: number;
  accuracy?: number;
  status?: string;
}

interface AssignReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewerIds: string[]) => void;
  reviewers: Reviewer[];
}

const AssignReviewerModal = ({ isOpen, onClose, onSubmit, reviewers }: AssignReviewerModalProps) => {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    if (selectedReviewers.includes(id)) {
      setSelectedReviewers(selectedReviewers.filter(item => item !== id));
    } else {
      setSelectedReviewers([...selectedReviewers, id]);
    }
  };

  const handleSubmit = () => {
    onSubmit(selectedReviewers);
    setSelectedReviewers([]);
    onClose();
  };

  const copyToClipboard = (wallet: string) => {
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const truncateWallet = (wallet: string) => {
    if (!wallet) return 'N/A';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Assign to Reviewer(s)</h2>
          <p className="text-sm text-white/80 mt-1">Select one or more reviewers to assign this submission</p>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {reviewers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p>No reviewers available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewers.map(reviewer => {
                const wallet = reviewer.user?.wallet || reviewer.wallet;
                const handle = reviewer.user?.handle;
                const isSelected = selectedReviewers.includes(reviewer.id);
                
                return (
                  <div 
                    key={reviewer.id} 
                    className={`bg-gray-800 border-2 rounded-lg p-4 transition-all cursor-pointer hover:bg-gray-750 ${
                      isSelected ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700'
                    }`}
                    onClick={() => handleSelect(reviewer.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input 
                        type="checkbox" 
                        id={`reviewer-${reviewer.id}`} 
                        checked={isSelected}
                        onChange={() => handleSelect(reviewer.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-600 text-yellow-600 focus:ring-yellow-500 focus:ring-offset-gray-900 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Handle or Wallet */}
                        <div className="flex items-center gap-2 mb-2">
                          <label 
                            htmlFor={`reviewer-${reviewer.id}`} 
                            className="font-semibold text-white cursor-pointer"
                          >
                            {handle || 'Reviewer'}
                          </label>
                          {reviewer.status === 'active' && (
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        
                        {/* Wallet Address */}
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm text-gray-400 font-mono">
                            {truncateWallet(wallet)}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(wallet);
                            }}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Copy full address"
                          >
                            {copiedWallet === wallet ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Stats */}
                        {(reviewer.total_reviews !== undefined || reviewer.accuracy !== undefined) && (
                          <div className="flex gap-4 text-xs text-gray-400">
                            {reviewer.total_reviews !== undefined && (
                              <span>📊 {reviewer.total_reviews} reviews</span>
                            )}
                            {reviewer.accuracy !== undefined && (
                              <span>✓ {reviewer.accuracy}% accuracy</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between flex-shrink-0 rounded-b-xl">
          <div className="text-sm text-gray-400">
            {selectedReviewers.length > 0 ? (
              <span>{selectedReviewers.length} reviewer(s) selected</span>
            ) : (
              <span>Select at least one reviewer</span>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={selectedReviewers.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign ({selectedReviewers.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignReviewerModal;
