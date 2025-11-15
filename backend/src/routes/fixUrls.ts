import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/fix-submission-urls', async (req: Request, res: Response) => {
  try {
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
    const updated = [];
    for (const submission of submissions) {
      const randomAvatarId = avatarIds[Math.floor(Math.random() * avatarIds.length)];
      const newUrl = `https://avatar.iran.liara.run/public/${randomAvatarId}`;

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          file_url: newUrl
        }
      });

      updated.push(submission.id);
      console.log(`✅ Updated submission ${submission.id}`);
    }

    res.json({
      success: true,
      message: `Fixed ${updated.length} submissions`,
      updated
    });
  } catch (error: any) {
    console.error('Error fixing submission URLs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
