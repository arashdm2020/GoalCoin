#!/bin/bash

# Render.com safe build script for GoalCoin backend
echo "🚀 Starting GoalCoin backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Apply safe migrations (not db push!)
echo "🔄 Applying database migrations safely..."
# Check if we need to run the safe migration SQL directly
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkAndMigrate() {
  try {
    // Check if new schema exists
    await prisma.user.findFirst({ select: { id: true } });
    console.log('✅ New schema detected, running migrate deploy');
    process.exit(0);
  } catch (error) {
    if (error.code === 'P2022') {
      console.log('🔄 Old schema detected, running safe migration SQL');
      const migrationSQL = fs.readFileSync('prisma/migrations/20241106_safe_user_migration/migration.sql', 'utf8');
      await prisma.\$executeRawUnsafe(migrationSQL);
      console.log('✅ Safe migration completed');
      process.exit(0);
    }
    throw error;
  }
}

checkAndMigrate().catch(console.error);
"
npx prisma migrate deploy

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"
