'use client';

import { useState, useEffect } from 'react';

/**
 * Countdown component displaying days remaining until goal
 * Counts down 30 days from the current date
 */
export function Countdown() {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    // Calculate target date: 30 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

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
  }, []);

  if (!timeRemaining) {
    return <div className="text-[#FFD700]">Loading...</div>;
  }

  return (
    <div className="flex gap-4 text-center">
      <div className="flex flex-col">
        <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.days}</div>
        <div className="text-sm text-gray-400">Days</div>
      </div>
      <div className="flex flex-col">
        <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.hours}</div>
        <div className="text-sm text-gray-400">Hours</div>
      </div>
      <div className="flex flex-col">
        <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.minutes}</div>
        <div className="text-sm text-gray-400">Minutes</div>
      </div>
      <div className="flex flex-col">
        <div className="text-4xl font-bold text-[#FFD700]">{timeRemaining.seconds}</div>
        <div className="text-sm text-gray-400">Seconds</div>
      </div>
    </div>
  );
}
