'use client';

import { useState, useEffect } from 'react';

/**
 * Countdown component displaying days remaining until goal
 * Fetches target date from API settings
 */
export function Countdown() {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [title, setTitle] = useState('Launch Countdown');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Fetch countdown settings from API
    const fetchSettings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
        const response = await fetch(`${backendUrl}/api/settings/countdown`);
        
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title || 'Launch Countdown');
          setEnabled(data.enabled);
          
          if (data.targetDate && data.enabled) {
            const targetDate = new Date(data.targetDate);
            
            const updateCountdown = () => {
              const now = new Date();
              const difference = targetDate.getTime() - now.getTime();

              if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeRemaining({ days, hours, minutes, seconds });
              } else {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
              }
            };

            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);

            return () => clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error fetching countdown settings:', error);
      }
    };

    fetchSettings();
  }, []);

  if (!enabled) {
    return null;
  }

  if (!timeRemaining) {
    return <div className="text-[#FFD700]">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-2xl font-semibold text-[#FFD700]">{title}</h3>
      <div className="flex gap-4 text-center">
        <div className="flex flex-col bg-gray-900 border border-[#FFD700]/30 rounded-lg p-4 min-w-[80px]">
          <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.days}</div>
          <div className="text-sm text-gray-400 mt-1">Days</div>
        </div>
        <div className="flex flex-col bg-gray-900 border border-[#FFD700]/30 rounded-lg p-4 min-w-[80px]">
          <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.hours}</div>
          <div className="text-sm text-gray-400 mt-1">Hours</div>
        </div>
        <div className="flex flex-col bg-gray-900 border border-[#FFD700]/30 rounded-lg p-4 min-w-[80px]">
          <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.minutes}</div>
          <div className="text-sm text-gray-400 mt-1">Minutes</div>
        </div>
        <div className="flex flex-col bg-gray-900 border border-[#FFD700]/30 rounded-lg p-4 min-w-[80px]">
          <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.seconds}</div>
          <div className="text-sm text-gray-400 mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
}
