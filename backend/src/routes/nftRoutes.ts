import { Router, Request, Response } from 'express';
import { nftService } from '../services/nftService';
import { authMiddleware } from '../middleware/auth';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

/**
 * GET /api/nft/check/:wallet
 * Check if wallet has Founder NFT
 */
router.get('/check/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const result = await nftService.checkNFT(wallet);
    res.json(result);
  } catch (error: any) {
    console.error('Error checking NFT:', error);
    res.status(500).json({ error: 'Failed to check NFT' });
  }
});

/**
 * GET /api/nft/metadata/:wallet
 * Get NFT metadata for wallet
 */
router.get('/metadata/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const metadata = await nftService.getNFTMetadata(wallet);
    
    if (!metadata) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    res.json(metadata);
  } catch (error: any) {
    console.error('Error getting NFT metadata:', error);
    res.status(500).json({ error: 'Failed to get NFT metadata' });
  }
});

/**
 * POST /api/nft/grant-founder
 * Grant Founder NFT benefits (admin only)
 */
router.post('/grant-founder', basicAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await nftService.grantFounderBenefits(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error granting founder benefits:', error);
    res.status(500).json({ error: 'Failed to grant founder benefits' });
  }
});

export default router;
