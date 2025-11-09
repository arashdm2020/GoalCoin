/**
 * Warm-Up Catalog
 * Rule-based warm-up generator with atomic moves
 * No per-user schedules - generates daily warm-up from tags
 */

export interface WarmupMove {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_areas: string[];
  equipment_needed: string[];
  video_url?: string;
  thumbnail_url?: string;
}

export interface WarmupRoutine {
  id: string;
  name: string;
  total_duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  moves: WarmupMove[];
  xp_reward: number;
}

/**
 * Atomic warm-up moves catalog
 */
export const WARMUP_MOVES: WarmupMove[] = [
  // Upper Body
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    description: 'Stand with arms extended, make small circles, gradually increasing size',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['shoulders', 'arms'],
    equipment_needed: [],
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    description: 'Roll shoulders forward and backward in a circular motion',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['shoulders', 'upper-back'],
    equipment_needed: [],
  },
  {
    id: 'neck-rotations',
    name: 'Neck Rotations',
    description: 'Gently rotate neck in circular motion, both directions',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['neck'],
    equipment_needed: [],
  },

  // Core
  {
    id: 'torso-twists',
    name: 'Torso Twists',
    description: 'Stand with feet shoulder-width, twist torso left and right',
    duration_seconds: 45,
    difficulty: 'beginner',
    target_areas: ['core', 'obliques'],
    equipment_needed: [],
  },
  {
    id: 'cat-cow-stretch',
    name: 'Cat-Cow Stretch',
    description: 'On hands and knees, alternate between arching and rounding spine',
    duration_seconds: 60,
    difficulty: 'beginner',
    target_areas: ['spine', 'core'],
    equipment_needed: [],
  },

  // Lower Body
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    description: 'Hold wall for balance, swing leg forward and back',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['hips', 'legs'],
    equipment_needed: [],
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    description: 'Hands on hips, rotate hips in circular motion',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['hips', 'core'],
    equipment_needed: [],
  },
  {
    id: 'ankle-rolls',
    name: 'Ankle Rolls',
    description: 'Lift foot, rotate ankle in circles both directions',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['ankles'],
    equipment_needed: [],
  },
  {
    id: 'knee-circles',
    name: 'Knee Circles',
    description: 'Feet together, hands on knees, rotate in circular motion',
    duration_seconds: 30,
    difficulty: 'beginner',
    target_areas: ['knees', 'legs'],
    equipment_needed: [],
  },

  // Dynamic Movements
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'Jump with legs spread and arms overhead, return to start',
    duration_seconds: 45,
    difficulty: 'intermediate',
    target_areas: ['full-body', 'cardio'],
    equipment_needed: [],
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    description: 'Run in place, bringing knees up to hip level',
    duration_seconds: 30,
    difficulty: 'intermediate',
    target_areas: ['legs', 'cardio'],
    equipment_needed: [],
  },
  {
    id: 'butt-kicks',
    name: 'Butt Kicks',
    description: 'Run in place, kicking heels up to touch glutes',
    duration_seconds: 30,
    difficulty: 'intermediate',
    target_areas: ['hamstrings', 'cardio'],
    equipment_needed: [],
  },
  {
    id: 'inchworms',
    name: 'Inchworms',
    description: 'Bend at waist, walk hands out to plank, walk feet to hands',
    duration_seconds: 45,
    difficulty: 'intermediate',
    target_areas: ['full-body', 'core'],
    equipment_needed: [],
  },

  // Advanced
  {
    id: 'burpees-light',
    name: 'Light Burpees',
    description: 'Squat, place hands down, jump feet back, return and stand',
    duration_seconds: 45,
    difficulty: 'advanced',
    target_areas: ['full-body', 'cardio'],
    equipment_needed: [],
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'Plank position, alternate bringing knees to chest',
    duration_seconds: 30,
    difficulty: 'advanced',
    target_areas: ['core', 'cardio'],
    equipment_needed: [],
  },
];

/**
 * Pre-defined warm-up routines
 */
export const WARMUP_ROUTINES: Record<string, WarmupRoutine> = {
  beginner_5min: {
    id: 'beginner_5min',
    name: '5-Minute Beginner Warm-Up',
    total_duration: 300,
    difficulty: 'beginner',
    xp_reward: 5,
    moves: [
      WARMUP_MOVES.find(m => m.id === 'neck-rotations')!,
      WARMUP_MOVES.find(m => m.id === 'shoulder-rolls')!,
      WARMUP_MOVES.find(m => m.id === 'arm-circles')!,
      WARMUP_MOVES.find(m => m.id === 'torso-twists')!,
      WARMUP_MOVES.find(m => m.id === 'hip-circles')!,
      WARMUP_MOVES.find(m => m.id === 'leg-swings')!,
      WARMUP_MOVES.find(m => m.id === 'ankle-rolls')!,
    ],
  },
  
  intermediate_7min: {
    id: 'intermediate_7min',
    name: '7-Minute Dynamic Warm-Up',
    total_duration: 420,
    difficulty: 'intermediate',
    xp_reward: 7,
    moves: [
      WARMUP_MOVES.find(m => m.id === 'arm-circles')!,
      WARMUP_MOVES.find(m => m.id === 'torso-twists')!,
      WARMUP_MOVES.find(m => m.id === 'leg-swings')!,
      WARMUP_MOVES.find(m => m.id === 'jumping-jacks')!,
      WARMUP_MOVES.find(m => m.id === 'high-knees')!,
      WARMUP_MOVES.find(m => m.id === 'butt-kicks')!,
      WARMUP_MOVES.find(m => m.id === 'inchworms')!,
    ],
  },
  
  advanced_10min: {
    id: 'advanced_10min',
    name: '10-Minute Full-Body Activation',
    total_duration: 600,
    difficulty: 'advanced',
    xp_reward: 10,
    moves: [
      WARMUP_MOVES.find(m => m.id === 'arm-circles')!,
      WARMUP_MOVES.find(m => m.id === 'cat-cow-stretch')!,
      WARMUP_MOVES.find(m => m.id === 'leg-swings')!,
      WARMUP_MOVES.find(m => m.id === 'jumping-jacks')!,
      WARMUP_MOVES.find(m => m.id === 'high-knees')!,
      WARMUP_MOVES.find(m => m.id === 'inchworms')!,
      WARMUP_MOVES.find(m => m.id === 'mountain-climbers')!,
      WARMUP_MOVES.find(m => m.id === 'burpees-light')!,
    ],
  },
};

/**
 * Generate daily warm-up based on user level and preferences
 */
export function generateDailyWarmup(
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  targetDuration: number = 300 // 5 minutes default
): WarmupRoutine {
  const routineKey = `${userLevel}_${Math.floor(targetDuration / 60)}min`;
  
  // Return pre-defined routine if exists
  if (WARMUP_ROUTINES[routineKey]) {
    return WARMUP_ROUTINES[routineKey];
  }
  
  // Otherwise, generate custom routine
  const availableMoves = WARMUP_MOVES.filter(m => m.difficulty === userLevel);
  const selectedMoves: WarmupMove[] = [];
  let currentDuration = 0;
  
  // Ensure variety: upper, core, lower, dynamic
  const categories = ['shoulders', 'core', 'hips', 'cardio'];
  
  for (const category of categories) {
    const categoryMoves = availableMoves.filter(m => 
      m.target_areas.some(area => area.includes(category))
    );
    
    if (categoryMoves.length > 0 && currentDuration < targetDuration) {
      const randomMove = categoryMoves[Math.floor(Math.random() * categoryMoves.length)];
      selectedMoves.push(randomMove);
      currentDuration += randomMove.duration_seconds;
    }
  }
  
  return {
    id: `custom_${userLevel}_${Date.now()}`,
    name: `Custom ${userLevel.charAt(0).toUpperCase() + userLevel.slice(1)} Warm-Up`,
    total_duration: currentDuration,
    difficulty: userLevel,
    xp_reward: Math.floor(currentDuration / 60),
    moves: selectedMoves,
  };
}

/**
 * Get today's recommended warm-up
 */
export function getTodaysWarmup(userId: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): WarmupRoutine {
  // Use date + userId for deterministic daily routine
  const today = new Date().toISOString().split('T')[0];
  const seed = `${userId}_${today}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const routines = Object.values(WARMUP_ROUTINES).filter(r => r.difficulty === userLevel);
  const index = seed % routines.length;
  
  return routines[index];
}
