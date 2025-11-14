'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface Meal {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  description: string;
  ingredients: string[];
  tier: string;
  prep_time_min: number;
  protein_g?: number;
}

interface MealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  region: string;
  country: string;
}

interface MealStats {
  current_streak: number;
  total_meals: number;
  total_xp_earned: number;
}

export default function MealsPage() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('auto');
  const { toast, showToast, hideToast } = useToast();

  const regions = [
    { value: 'auto', label: 'Auto (Based on location)' },
    { value: 'middle_east', label: 'Middle East' },
    { value: 'north_america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia' },
  ];

  useEffect(() => {
    fetchMealData();
  }, [selectedRegion]);

  const fetchMealData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://goalcoin.onrender.com';
      
      // Fetch today's meal plan
      const planRes = await fetch(
        `${backendUrl}/api/meals/today${selectedRegion !== 'auto' ? `?region=${selectedRegion}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!planRes.ok) {
        throw new Error('Failed to fetch meal plan');
      }
      
      const planData = await planRes.json();
      
      // Validate meal plan data
      if (planData && planData.breakfast && planData.lunch && planData.dinner) {
        setMealPlan(planData);
      } else {
        console.error('Invalid meal plan data:', planData);
        setMealPlan(null);
      }

      // Fetch stats
      const statsRes = await fetch(`${backendUrl}/api/meals/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching meal data:', error);
      setLoading(false);
    }
  };

  const logMeal = async (mealId: string, mealType: string, calories: number) => {
    setLogging(mealType);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://goalcoin.onrender.com';
      const res = await fetch(`${backendUrl}/api/meals/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meal_id: mealId,
          meal_type: mealType,
          calories: calories,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        showToast(`✅ Meal logged! +${data.xp_awarded || data.xp_earned} XP`, 'success');
        fetchMealData(); // Refresh stats
      } else {
        showToast(data.error || 'Failed to log meal', 'error');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      showToast('Failed to log meal', 'error');
    } finally {
      setLogging(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading meal plan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">🍽️ Daily Meal Plan</h1>
          <p className="text-gray-400">Log your meals to earn XP and maintain your nutrition streak</p>
        </div>

        {/* Region Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Region:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
              <div className="text-3xl font-bold text-green-500">{stats.current_streak}</div>
              <div className="text-gray-400">Day Streak 🥗</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold">{stats.total_meals}</div>
              <div className="text-gray-400">Meals Logged</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-yellow-500">{stats.total_xp_earned}</div>
              <div className="text-gray-400">XP Earned</div>
            </div>
          </div>
        )}

        {/* Meal Plan */}
        {mealPlan && mealPlan.breakfast && mealPlan.lunch && mealPlan.dinner ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-400 mb-4">
              Region: {mealPlan.region} | Country: {mealPlan.country}
            </div>

            {/* Breakfast */}
            <MealCard
              meal={mealPlan.breakfast}
              icon="🌅"
              logging={logging === 'breakfast'}
              onLog={() => logMeal(mealPlan.breakfast.id, 'breakfast', mealPlan.breakfast.calories || 0)}
            />

            {/* Lunch */}
            <MealCard
              meal={mealPlan.lunch}
              icon="☀️"
              logging={logging === 'lunch'}
              onLog={() => logMeal(mealPlan.lunch.id, 'lunch', mealPlan.lunch.calories || 0)}
            />

            {/* Dinner */}
            <MealCard
              meal={mealPlan.dinner}
              icon="🌙"
              logging={logging === 'dinner'}
              onLog={() => logMeal(mealPlan.dinner.id, 'dinner', mealPlan.dinner.calories || 0)}
            />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No Meal Plan Available</h3>
            <p className="text-gray-400">Please try selecting a different region or refresh the page.</p>
          </div>
        )}
      </div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

function MealCard({
  meal,
  icon,
  logging,
  onLog,
}: {
  meal: Meal;
  icon: string;
  logging: boolean;
  onLog: () => void;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-2xl font-bold capitalize">{meal.category}</h3>
          </div>
          <h4 className="text-xl font-semibold mb-2">{meal.title}</h4>
          <p className="text-gray-400 mb-3">{meal.description}</p>
          <div className="text-sm text-orange-500 font-semibold">
            🔥 {meal.calories || 0} calories {meal.protein_g ? `| 💪 ${meal.protein_g}g protein` : ''}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ⏱️ {meal.prep_time_min} min prep | Tier: {meal.tier}
          </div>
        </div>
        <button
          onClick={onLog}
          disabled={logging}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {logging ? 'Logging...' : 'Log Meal'}
        </button>
      </div>

      {/* Ingredients */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h5 className="font-semibold mb-2">Ingredients:</h5>
        <div className="flex flex-wrap gap-2">
          {meal.ingredients.map((ingredient, idx) => (
            <span
              key={idx}
              className="bg-gray-900 px-3 py-1 rounded-full text-sm"
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
