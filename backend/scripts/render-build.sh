#!/bin/bash

# Render.com safe build script for GoalCoin backend
echo "🚀 Starting GoalCoin backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Apply safe migrations (not db push!)
echo "🔄 Applying database migrations safely..."
node scripts/migrate-production.js

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"
