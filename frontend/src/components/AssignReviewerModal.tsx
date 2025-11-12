'use client';

import { useState } from 'react';

interface Reviewer {
  id: number;
  wallet: string;
}

interface AssignReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewerIds: number[]) => void;
  reviewers: Reviewer[];
}

const AssignReviewerModal = ({ isOpen, onClose, onSubmit, reviewers }: AssignReviewerModalProps) => {
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);

  if (!isOpen) return null;

  const handleSelect = (id: number) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Assign to Reviewer(s)</h2>
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {reviewers.map(reviewer => (
            <div key={reviewer.id} className="flex items-center bg-gray-800 p-3 rounded-lg">
              <input 
                type="checkbox" 
                id={`reviewer-${reviewer.id}`} 
                checked={selectedReviewers.includes(reviewer.id)}
                onChange={() => handleSelect(reviewer.id)}
                className="mr-3"
              />
              <label htmlFor={`reviewer-${reviewer.id}`} className="font-mono text-sm">{reviewer.wallet}</label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg mr-2">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-yellow-600 rounded-lg">Assign</button>
        </div>
      </div>
    </div>
  );
};

export default AssignReviewerModal;
