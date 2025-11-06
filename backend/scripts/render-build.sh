#!/bin/bash

# Render.com safe build script for GoalCoin backend
echo "🚀 Starting GoalCoin backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Synchronize database schema
echo "🔄 Synchronizing database schema with Prisma schema..."
npx prisma db push

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"
