'use client';

import { useState } from 'react';

interface AddCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commission: { wallet: string; amount: number; currency: 'USDT' | 'GC' }) => void;
}

const AddCommissionModal = ({ isOpen, onClose, onSubmit }: AddCommissionModalProps) => {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<'USDT' | 'GC'>('USDT');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ wallet, amount, currency });
    setWallet('');
    setAmount(0);
    setCurrency('USDT');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add Manual Commission</h2>
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Wallet Address"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Amount"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
          <select 
            value={currency} 
            onChange={e => setCurrency(e.target.value as 'USDT' | 'GC')}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="USDT">USDT</option>
            <option value="GC">GC</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg mr-2">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 rounded-lg">Add Commission</button>
        </div>
      </div>
    </div>
  );
};

export default AddCommissionModal;
