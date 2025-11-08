'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DietPlan {
  id: string;
  tier: string;
  title: string;
  description: string;
  meals: string[];
}

export default function DietPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchPlans();
  }, [router]);

  const fetchPlans = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/fitness/diet-plans`);
      const data = await response.json();
      setPlans(data.plans || []);
      if (data.plans && data.plans.length > 0) {
        setSelectedPlan(data.plans[0]);
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!selectedPlan) return;

    setLogging(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`${backendUrl}/api/fitness/meal/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          diet_plan_id: selectedPlan.id,
          meal_name: 'Daily Meal',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`🥗 Meal logged! +${data.xp_earned} XP earned!`);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Failed to log meal');
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center">
        <div className="text-xl">Loading diet plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🥗 Diet Plans</h1>
          <p className="text-gray-400 text-lg">
            Choose a plan and log your meals
          </p>
        </div>

        {/* Plan Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedPlan?.id === plan.id
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {plan.tier}
            </button>
          ))}
        </div>

        {selectedPlan && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">{selectedPlan.title}</h2>
              <p className="text-gray-400 mb-8">{selectedPlan.description}</p>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">📋 Sample Meals:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlan.meals.map((meal, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <p className="text-gray-300">{meal}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-200">
                  🌟 <strong>GoalCoin Meal of the Day:</strong> Follow this plan and log your meal to earn XP and maintain your streak!
                </p>
              </div>

              <button
                onClick={handleLogMeal}
                disabled={logging}
                className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {logging ? 'Logging...' : 'Log Meal Completed (+5 XP)'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
