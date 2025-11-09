/**
 * Meal Catalog
 * Regional meal plans with base → region → country fallback
 * AI-generated content with manual approval
 */

export interface MealItem {
  id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tier: 'budget' | 'balanced' | 'protein-boost';
  region: 'global' | 'africa' | 'americas' | 'europe' | 'asia' | 'middle-east';
  country_codes?: string[]; // Specific countries (e.g., ['NG', 'GH'])
  ingredients: string[];
  substitutions?: string[];
  prep_time_min: number;
  calories?: number;
  protein_g?: number;
  notes?: string;
  image_url?: string;
  approved: boolean;
  xp_reward: number;
}

/**
 * Base global meals (fallback)
 */
export const GLOBAL_MEALS: MealItem[] = [
  // Breakfast
  {
    id: 'global-breakfast-oatmeal',
    title: 'Classic Oatmeal Bowl',
    description: 'Hearty oats with banana and honey',
    category: 'breakfast',
    tier: 'budget',
    region: 'global',
    ingredients: ['Rolled oats', 'Banana', 'Honey', 'Milk or water'],
    substitutions: ['Use almond milk for dairy-free', 'Add berries instead of banana'],
    prep_time_min: 10,
    calories: 300,
    protein_g: 10,
    notes: 'Quick and filling breakfast',
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'global-breakfast-eggs',
    title: 'Scrambled Eggs & Toast',
    description: 'Protein-packed eggs with whole grain toast',
    category: 'breakfast',
    tier: 'balanced',
    region: 'global',
    ingredients: ['2 eggs', 'Whole grain bread', 'Butter', 'Salt & pepper'],
    substitutions: ['Use egg whites only', 'Add vegetables'],
    prep_time_min: 15,
    calories: 350,
    protein_g: 18,
    approved: true,
    xp_reward: 5,
  },
  
  // Lunch
  {
    id: 'global-lunch-chicken-rice',
    title: 'Grilled Chicken & Rice',
    description: 'Lean protein with brown rice and vegetables',
    category: 'lunch',
    tier: 'protein-boost',
    region: 'global',
    ingredients: ['Chicken breast', 'Brown rice', 'Mixed vegetables', 'Olive oil'],
    substitutions: ['Use fish instead of chicken', 'Quinoa instead of rice'],
    prep_time_min: 30,
    calories: 500,
    protein_g: 35,
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'global-lunch-salad',
    title: 'Mediterranean Salad',
    description: 'Fresh greens with feta and olive oil',
    category: 'lunch',
    tier: 'balanced',
    region: 'global',
    ingredients: ['Mixed greens', 'Tomatoes', 'Cucumber', 'Feta cheese', 'Olive oil'],
    substitutions: ['Add grilled chicken', 'Use balsamic vinegar'],
    prep_time_min: 15,
    calories: 300,
    protein_g: 12,
    approved: true,
    xp_reward: 5,
  },
  
  // Dinner
  {
    id: 'global-dinner-pasta',
    title: 'Whole Wheat Pasta with Vegetables',
    description: 'Healthy pasta with seasonal vegetables',
    category: 'dinner',
    tier: 'budget',
    region: 'global',
    ingredients: ['Whole wheat pasta', 'Tomato sauce', 'Mixed vegetables', 'Garlic'],
    substitutions: ['Add ground turkey', 'Use zucchini noodles'],
    prep_time_min: 25,
    calories: 450,
    protein_g: 15,
    approved: true,
    xp_reward: 5,
  },
  
  // Snacks
  {
    id: 'global-snack-nuts',
    title: 'Mixed Nuts & Fruit',
    description: 'Healthy snack with protein and natural sugars',
    category: 'snack',
    tier: 'balanced',
    region: 'global',
    ingredients: ['Almonds', 'Walnuts', 'Apple or orange'],
    prep_time_min: 2,
    calories: 200,
    protein_g: 8,
    approved: true,
    xp_reward: 3,
  },
];

/**
 * African regional meals
 */
export const AFRICAN_MEALS: MealItem[] = [
  {
    id: 'africa-breakfast-akara',
    title: 'Akara (Bean Cakes)',
    description: 'Nigerian bean fritters with pap',
    category: 'breakfast',
    tier: 'budget',
    region: 'africa',
    country_codes: ['NG', 'GH', 'BJ'],
    ingredients: ['Black-eyed peas', 'Onions', 'Pepper', 'Palm oil'],
    substitutions: ['Serve with bread instead of pap'],
    prep_time_min: 30,
    calories: 350,
    protein_g: 15,
    notes: 'Traditional West African breakfast',
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'africa-lunch-jollof',
    title: 'Jollof Rice with Grilled Fish',
    description: 'Classic West African rice dish',
    category: 'lunch',
    tier: 'balanced',
    region: 'africa',
    country_codes: ['NG', 'GH', 'SN'],
    ingredients: ['Rice', 'Tomatoes', 'Onions', 'Fish', 'Spices'],
    substitutions: ['Use chicken instead of fish'],
    prep_time_min: 45,
    calories: 550,
    protein_g: 30,
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'africa-dinner-egusi',
    title: 'Egusi Soup with Fufu',
    description: 'Melon seed soup with pounded yam',
    category: 'dinner',
    tier: 'protein-boost',
    region: 'africa',
    country_codes: ['NG', 'CM'],
    ingredients: ['Egusi (melon seeds)', 'Spinach', 'Meat', 'Palm oil'],
    substitutions: ['Use eba instead of fufu'],
    prep_time_min: 60,
    calories: 600,
    protein_g: 35,
    approved: true,
    xp_reward: 5,
  },
];

/**
 * American regional meals
 */
export const AMERICAN_MEALS: MealItem[] = [
  {
    id: 'americas-breakfast-burrito',
    title: 'Breakfast Burrito',
    description: 'Eggs, beans, and cheese wrapped in tortilla',
    category: 'breakfast',
    tier: 'balanced',
    region: 'americas',
    country_codes: ['US', 'MX'],
    ingredients: ['Tortilla', 'Eggs', 'Black beans', 'Cheese', 'Salsa'],
    substitutions: ['Use turkey sausage', 'Add avocado'],
    prep_time_min: 20,
    calories: 450,
    protein_g: 22,
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'americas-lunch-tacos',
    title: 'Grilled Chicken Tacos',
    description: 'Lean protein tacos with fresh toppings',
    category: 'lunch',
    tier: 'protein-boost',
    region: 'americas',
    country_codes: ['US', 'MX'],
    ingredients: ['Corn tortillas', 'Grilled chicken', 'Lettuce', 'Tomatoes', 'Lime'],
    substitutions: ['Use fish instead of chicken'],
    prep_time_min: 25,
    calories: 400,
    protein_g: 30,
    approved: true,
    xp_reward: 5,
  },
];

/**
 * Asian regional meals
 */
export const ASIAN_MEALS: MealItem[] = [
  {
    id: 'asia-breakfast-congee',
    title: 'Rice Congee',
    description: 'Comforting rice porridge with toppings',
    category: 'breakfast',
    tier: 'budget',
    region: 'asia',
    country_codes: ['CN', 'TH', 'VN'],
    ingredients: ['Rice', 'Water', 'Ginger', 'Green onions', 'Egg'],
    substitutions: ['Add chicken or fish'],
    prep_time_min: 40,
    calories: 250,
    protein_g: 8,
    approved: true,
    xp_reward: 5,
  },
  {
    id: 'asia-lunch-stirfry',
    title: 'Vegetable Stir-Fry with Tofu',
    description: 'Quick and healthy Asian-style stir-fry',
    category: 'lunch',
    tier: 'balanced',
    region: 'asia',
    ingredients: ['Tofu', 'Mixed vegetables', 'Soy sauce', 'Garlic', 'Rice'],
    substitutions: ['Use chicken instead of tofu'],
    prep_time_min: 20,
    calories: 400,
    protein_g: 20,
    approved: true,
    xp_reward: 5,
  },
];

/**
 * Get meals by country with fallback logic
 * Priority: Country-specific → Regional → Global
 */
export function getMealsByCountry(
  countryCode: string,
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  tier?: 'budget' | 'balanced' | 'protein-boost'
): MealItem[] {
  // Determine region from country code
  const regionMap: Record<string, string> = {
    NG: 'africa', GH: 'africa', KE: 'africa', ZA: 'africa', EG: 'africa',
    US: 'americas', CA: 'americas', MX: 'americas', BR: 'americas',
    CN: 'asia', JP: 'asia', IN: 'asia', TH: 'asia', VN: 'asia',
    GB: 'europe', DE: 'europe', FR: 'europe', IT: 'europe',
    SA: 'middle-east', AE: 'middle-east', TR: 'middle-east',
  };
  
  const region = regionMap[countryCode] || 'global';
  
  // Collect all meals
  const allMeals = [
    ...GLOBAL_MEALS,
    ...AFRICAN_MEALS,
    ...AMERICAN_MEALS,
    ...ASIAN_MEALS,
  ];
  
  // Filter by country, region, or global (with priority)
  let meals = allMeals.filter(meal => {
    // Country-specific match (highest priority)
    if (meal.country_codes?.includes(countryCode)) return true;
    
    // Regional match
    if (meal.region === region) return true;
    
    // Global fallback
    if (meal.region === 'global') return true;
    
    return false;
  });
  
  // Filter by category if specified
  if (category) {
    meals = meals.filter(m => m.category === category);
  }
  
  // Filter by tier if specified
  if (tier) {
    meals = meals.filter(m => m.tier === tier);
  }
  
  // Sort by priority: country > region > global
  meals.sort((a, b) => {
    const aScore = a.country_codes?.includes(countryCode) ? 3 : (a.region === region ? 2 : 1);
    const bScore = b.country_codes?.includes(countryCode) ? 3 : (b.region === region ? 2 : 1);
    return bScore - aScore;
  });
  
  return meals;
}

/**
 * Get meal of the day (deterministic based on date)
 */
export function getMealOfTheDay(
  countryCode: string,
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch'
): MealItem {
  const meals = getMealsByCountry(countryCode, category);
  
  if (meals.length === 0) {
    // Fallback to global meals
    const globalMeals = GLOBAL_MEALS.filter(m => m.category === category);
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return globalMeals[seed % globalMeals.length];
  }
  
  // Use date as seed for deterministic selection
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return meals[seed % meals.length];
}
