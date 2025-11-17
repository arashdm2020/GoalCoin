import { Request, Response } from 'express';
import { PrismaClient, PaymentTier } from '@prisma/client';
import CoinPayments from 'coinpayments';
import { challengeService } from '../services/challengeService';

const prisma = new PrismaClient();

const COINPAYMENTS_KEY = process.env.COINPAYMENTS_PUBLIC_KEY || '';
const COINPAYMENTS_SECRET = process.env.COINPAYMENTS_PRIVATE_KEY || '';
const COINPAYMENTS_IPN_URL = process.env.COINPAYMENTS_IPN_URL || '';

let coinpaymentsClient: CoinPayments | null = null;
if (COINPAYMENTS_KEY && COINPAYMENTS_SECRET) {
  coinpaymentsClient = new CoinPayments({
    key: COINPAYMENTS_KEY,
    secret: COINPAYMENTS_SECRET,
  });
}

function mapTierToAmount(tier: PaymentTier): number {
  switch (tier) {
    case 'TIER_19': return 19;
    case 'TIER_35': return 35;
    case 'TIER_49': return 49;
    default: throw new Error('Invalid tier');
  }
}

export const paymentController = {
  async createChallengePayment(req: Request, res: Response): Promise<void> {
    const { wallet, email, country_code, tier } = req.body;

    if (!wallet || !tier) {
      res.status(400).json({ error: 'Wallet address and tier are required' });
      return;
    }

    try {
      // Check if challenge is full (200 participant cap)
      const eligibility = await challengeService.canJoin();
      if (!eligibility.allowed) {
        res.status(403).json({ 
          error: eligibility.message || 'Challenge is full',
          isFull: true,
        });
        return;
      }
      const user = await prisma.user.upsert({
        where: { wallet },
        update: { email, country_code },
        create: { wallet, email, country_code, tier: 'PLAYER' },
      });

      const amount = mapTierToAmount(tier);

      if (!coinpaymentsClient) {
        res.status(500).json({ error: 'CoinPayments client not configured' });
        return;
      }

      const cpRes = await coinpaymentsClient.createTransaction({
        currency1: 'USD',
        currency2: 'USDT.MATIC',
        amount,
        buyer_email: email,
        ipn_url: COINPAYMENTS_IPN_URL,
      });

      await prisma.payment.create({
        data: {
          user_id: user.id,
          tx_id: cpRes.txn_id,
          amount,
          tier,
          status: 'pending',
        },
      });

      res.status(200).json({ checkout_url: cpRes.checkout_url, txn_id: cpRes.txn_id });
    } catch (error) {
      console.error('Failed to create payment:', error);
      res.status(500).json({ error: 'Failed to create payment transaction' });
    }
  },
};
