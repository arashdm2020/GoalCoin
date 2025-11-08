import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding fitness content...');

  // Create warmup sessions
  const warmupSessions = [
    {
      title: 'Dynamic Stretching Routine',
      description: 'A 5-minute dynamic stretching routine to prepare your body for exercise',
      video_url: 'https://example.com/warmup-dynamic-stretch',
      duration_min: 5,
      order: 1,
    },
    {
      title: 'Cardio Warm-Up',
      description: 'Light cardio exercises to get your heart rate up',
      video_url: 'https://example.com/warmup-cardio',
      duration_min: 7,
      order: 2,
    },
    {
      title: 'Joint Mobility Routine',
      description: 'Gentle movements to improve joint flexibility and range of motion',
      video_url: 'https://example.com/warmup-mobility',
      duration_min: 6,
      order: 3,
    },
    {
      title: 'Full Body Activation',
      description: 'Activate all major muscle groups before your workout',
      video_url: 'https://example.com/warmup-full-body',
      duration_min: 8,
      order: 4,
    },
  ];

  for (const session of warmupSessions) {
    const existing = await prisma.warmupSession.findFirst({
      where: { title: session.title },
    });

    if (existing) {
      await prisma.warmupSession.update({
        where: { id: existing.id },
        data: session,
      });
    } else {
      await prisma.warmupSession.create({
        data: session,
      });
    }
  }

  console.log('✅ Created warmup sessions');

  // Create diet plans - Budget Tier
  const budgetPlans = [
    {
      title: 'Budget Protein Bowl',
      tier: 'BUDGET' as const,
      region: 'Global',
      description: 'Affordable high-protein meal with rice, eggs, and vegetables',
      ingredients: '1 cup rice, 3 eggs, mixed vegetables, olive oil, spices',
      instructions: 'Cook rice. Scramble eggs with vegetables. Season to taste. Combine and serve.',
      calories: 450,
      protein_g: 25,
    },
    {
      title: 'Lentil Power Soup',
      tier: 'BUDGET' as const,
      region: 'Middle East',
      description: 'Hearty lentil soup packed with protein and fiber',
      ingredients: '1 cup lentils, onion, garlic, tomatoes, cumin, vegetable broth',
      instructions: 'Sauté onion and garlic. Add lentils, tomatoes, spices, and broth. Simmer 30 minutes.',
      calories: 350,
      protein_g: 18,
    },
    {
      title: 'Chickpea Salad',
      tier: 'BUDGET' as const,
      region: 'Mediterranean',
      description: 'Fresh and filling chickpea salad',
      ingredients: '1 can chickpeas, cucumber, tomato, lemon juice, olive oil, parsley',
      instructions: 'Drain chickpeas. Chop vegetables. Mix all ingredients. Season with lemon and oil.',
      calories: 320,
      protein_g: 15,
    },
  ];

  // Create diet plans - Balanced Tier
  const balancedPlans = [
    {
      title: 'Grilled Chicken & Quinoa',
      tier: 'BALANCED' as const,
      region: 'Global',
      description: 'Balanced meal with lean protein and complex carbs',
      ingredients: '150g chicken breast, 1 cup quinoa, broccoli, olive oil, herbs',
      instructions: 'Grill seasoned chicken. Cook quinoa. Steam broccoli. Combine and drizzle with olive oil.',
      calories: 520,
      protein_g: 42,
    },
    {
      title: 'Salmon & Sweet Potato',
      tier: 'BALANCED' as const,
      region: 'Western',
      description: 'Omega-3 rich salmon with nutrient-dense sweet potato',
      ingredients: '150g salmon fillet, 1 medium sweet potato, asparagus, lemon, dill',
      instructions: 'Bake salmon with lemon and dill. Roast sweet potato. Grill asparagus. Serve together.',
      calories: 580,
      protein_g: 38,
    },
    {
      title: 'Turkey & Brown Rice Bowl',
      tier: 'BALANCED' as const,
      region: 'Global',
      description: 'Lean turkey with whole grain rice and vegetables',
      ingredients: '150g ground turkey, 1 cup brown rice, bell peppers, spinach, soy sauce',
      instructions: 'Cook turkey with vegetables. Prepare brown rice. Mix together with seasonings.',
      calories: 490,
      protein_g: 36,
    },
  ];

  // Create diet plans - Protein Boost Tier
  const proteinBoostPlans = [
    {
      title: 'Double Protein Power Bowl',
      tier: 'PROTEIN_BOOST' as const,
      region: 'Global',
      description: 'Maximum protein with chicken and Greek yogurt',
      ingredients: '200g chicken breast, 1 cup Greek yogurt, quinoa, almonds, berries',
      instructions: 'Grill chicken. Cook quinoa. Layer with Greek yogurt, nuts, and berries.',
      calories: 680,
      protein_g: 62,
    },
    {
      title: 'Steak & Egg Breakfast',
      tier: 'PROTEIN_BOOST' as const,
      region: 'Western',
      description: 'High-protein breakfast for serious gains',
      ingredients: '150g lean steak, 4 eggs, spinach, mushrooms, avocado',
      instructions: 'Grill steak to preference. Scramble eggs with vegetables. Serve with sliced avocado.',
      calories: 720,
      protein_g: 58,
    },
    {
      title: 'Tuna Protein Salad',
      tier: 'PROTEIN_BOOST' as const,
      region: 'Mediterranean',
      description: 'Protein-packed tuna with cottage cheese',
      ingredients: '2 cans tuna, 1 cup cottage cheese, mixed greens, olive oil, lemon',
      instructions: 'Drain tuna. Mix with cottage cheese. Serve over greens with olive oil and lemon.',
      calories: 550,
      protein_g: 65,
    },
  ];

  const allPlans = [...budgetPlans, ...balancedPlans, ...proteinBoostPlans];

  for (const plan of allPlans) {
    const existing = await prisma.dietPlan.findFirst({
      where: { title: plan.title },
    });

    if (existing) {
      await prisma.dietPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.dietPlan.create({
        data: plan,
      });
    }
  }

  console.log('✅ Created diet plans');
  console.log(`   - ${budgetPlans.length} Budget tier plans`);
  console.log(`   - ${balancedPlans.length} Balanced tier plans`);
  console.log(`   - ${proteinBoostPlans.length} Protein Boost tier plans`);

  console.log('🎉 Fitness content seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding fitness content:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
