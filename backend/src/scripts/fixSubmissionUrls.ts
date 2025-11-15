import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSubmissionUrls() {
  try {
    console.log('🔧 Fixing submission URLs...');

    // Avatar IDs to use
    const avatarIds = [14, 38, 68, 100];

    // Get all submissions with example.com URLs
    const submissions = await prisma.submission.findMany({
      where: {
        file_url: { contains: 'example.com' }
      }
    });

    console.log(`Found ${submissions.length} submissions to fix`);

    // Update each submission
    for (const submission of submissions) {
      const randomAvatarId = avatarIds[Math.floor(Math.random() * avatarIds.length)];
      const newUrl = `https://avatar.iran.liara.run/public/${randomAvatarId}`;

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          file_url: newUrl
        }
      });

      console.log(`✅ Updated submission ${submission.id}`);
    }

    console.log('✨ All submissions fixed!');
  } catch (error) {
    console.error('Error fixing submission URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSubmissionUrls();
