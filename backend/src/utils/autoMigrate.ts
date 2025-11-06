import { PrismaClient } from '@prisma/client';

/**
 * Auto-migration utility that runs at server startup
 * Handles schema migration from old to new format if needed
 */

const prisma = new PrismaClient();

export async function runAutoMigration(): Promise<void> {
  console.log('🔍 Checking database schema compatibility...');
  
  try {
    // Test if new schema exists by trying to access the id field
    await prisma.user.findFirst({ select: { id: true } });
    console.log('✅ Database schema is up to date');
    return;
  } catch (error: any) {
    if (error.code === 'P2022' && error.meta?.column === 'users.id') {
      console.log('🔄 Old schema detected, running auto-migration...');
      
      try {
        // Run the safe migration SQL directly
        console.log('📄 Executing schema migration...');
        
        // Add the new columns to the users table
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" TEXT;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wallet" TEXT;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" TEXT;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" TEXT;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'FAN';
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "founder_nft" BOOLEAN DEFAULT false;
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        `;
        
        // Update existing data: copy address to wallet and generate IDs
        console.log('🔄 Migrating existing data...');
        
        await prisma.$executeRaw`
          UPDATE "users" 
          SET 
            "id" = COALESCE("id", 'user_' || EXTRACT(EPOCH FROM NOW()) || '_' || RANDOM()),
            "wallet" = COALESCE("wallet", "address"),
            "created_at" = COALESCE("created_at", "connectedAt", CURRENT_TIMESTAMP)
          WHERE "id" IS NULL OR "wallet" IS NULL;
        `;
        
        // Add NOT NULL constraints safely
        console.log('🔧 Applying NOT NULL constraints...');
        await prisma.$executeRaw`ALTER TABLE "users" ADD CONSTRAINT "users_id_not_null" CHECK ("id" IS NOT NULL) NOT VALID;`;
        await prisma.$executeRaw`ALTER TABLE "users" VALIDATE CONSTRAINT "users_id_not_null";`;

        await prisma.$executeRaw`ALTER TABLE "users" ADD CONSTRAINT "users_wallet_not_null" CHECK ("wallet" IS NOT NULL) NOT VALID;`;
        await prisma.$executeRaw`ALTER TABLE "users" VALIDATE CONSTRAINT "users_wallet_not_null";`;
        
        // Add unique constraints
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_id_key" UNIQUE ("id");
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_wallet_key" UNIQUE ("wallet");
        `;
        
        // Set primary key
        await prisma.$executeRaw`
          ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
        `;
        
        console.log('✅ "users" table migration completed successfully!');
        
        // Verify the migration worked
        await prisma.user.findFirst({ select: { id: true, wallet: true } });
        console.log('✅ "users" table verification successful');
        
      } catch (migrationError) {
        console.error('❌ Auto-migration failed:', migrationError);
        // This is a critical failure, re-throw the error to stop the process.
        throw migrationError;
      }
    } else {
      console.error('❌ Unexpected database error:', error);
      throw error;
    }
  }
}
