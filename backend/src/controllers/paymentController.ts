import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

const COINPAYMENTS_PUBLIC_KEY = process.env.COINPAYMENTS_PUBLIC_KEY || '';
const COINPAYMENTS_PRIVATE_KEY = process.env.COINPAYMENTS_PRIVATE_KEY || '';
const COINPAYMENTS_MERCHANT_ID = process.env.COINPAYMENTS_MERCHANT_ID || '';
const COINPAYMENTS_IPN_SECRET = process.env.COINPAYMENTS_IPN_SECRET || '';
const COINPAYMENTS_CURRENCY = process.env.COINPAYMENTS_CURRENCY || 'USDT.MATIC';
const COINPAYMENTS_IPN_URL = process.env.COINPAYMENTS_IPN_URL || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://goal-coin.vercel.app';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'https://goalcoin.onrender.com';

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function mapTierAmount(tier: 'TIER_19' | 'TIER_35' | 'TIER_49'): number {
  switch (tier) {
    case 'TIER_19':
      return 19;
    case 'TIER_35':
      return 35;
    case 'TIER_49':
      return 49;
    default:
      return 19;
  }
}

async function createCoinPaymentsTransaction(params: {
  amount: number;
  currency2?: string;
  custom?: string;
  item_name?: string;
  buyer_email?: string;
}): Promise<{ checkout_url: string; txn_id: string } | null> {
  if (!COINPAYMENTS_PUBLIC_KEY || !COINPAYMENTS_PRIVATE_KEY || !COINPAYMENTS_MERCHANT_ID || !COINPAYMENTS_IPN_URL) {
    return null; // mock mode
  }

  const body = new URLSearchParams({
    version: '1',
    key: COINPAYMENTS_PUBLIC_KEY,
    cmd: 'create_transaction',
    amount: params.amount.toString(),
    currency1: 'USD',
    currency2: params.currency2 || COINPAYMENTS_CURRENCY,
    ipn_url: COINPAYMENTS_IPN_URL,
    item_name: params.item_name || 'GoalCoin 90-Day Challenge',
    custom: params.custom || '',
  });

  const hmac = crypto.createHmac('sha512', COINPAYMENTS_PRIVATE_KEY).update(body.toString()).digest('hex');

  const res = await (globalThis as any).fetch('https://www.coinpayments.net/api.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HMAC': hmac,
    },
    body: body.toString(),
  });

  const data: any = await res.json().catch(() => null);
  if (!data || !data.result || !data.result.checkout_url || !data.result.txn_id) {
    throw new Error('Failed to create CoinPayments transaction');
  }
  return { checkout_url: data.result.checkout_url, txn_id: data.result.txn_id };
}

async function splitRevenue(paymentId: string, amount: number) {
  const splits = [
    { pool: 'PRIZE_POOL' as const, pct: 0.7 },
    { pool: 'TREASURY_POOL' as const, pct: 0.2 },
    { pool: 'BURN_POOL' as const, pct: 0.1 },
  ];
  await prisma.$transaction(
    splits.map(s =>
      prismaAny.revenueSplit.create({
        data: {
          paymentId,
          pool: s.pool,
          amount: parseFloat((amount * s.pct).toFixed(2)),
        },
      })
    )
  );
}

export const paymentController = {
  // POST /api/payments/checkout
  // Starts a 90-day challenge and creates a CoinPayments transaction
  async checkout(req: Request, res: Response) {
    try {
      const { address, tier, country, email } = req.body as {
        address: string;
        tier: 'TIER_19' | 'TIER_35' | 'TIER_49';
        country?: string;
        email?: string;
      };

      if (!address || !isValidAddress(address)) {
        res.status(400).json({ error: 'Valid wallet address required' });
        return;
      }
      if (!tier || !['TIER_19', 'TIER_35', 'TIER_49'].includes(tier)) {
        res.status(400).json({ error: 'Invalid tier' });
        return;
      }

      const normalized = address.toLowerCase();

      // Ensure user exists and update country if provided
      await prismaAny.user.upsert({
        where: { address: normalized },
        update: ({ country: country ?? undefined } as any),
        create: ({ address: normalized, online: true, country: country ?? undefined } as any),
      });

      // Prevent overlapping active challenge
      const now = new Date();
      const active = await prismaAny.challenge.findFirst({
        where: { userAddress: normalized, endDate: { gt: now } },
      });
      if (active) {
        res.status(400).json({ error: 'Active challenge already exists' });
        return;
      }

      const startDate = now;
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      const amount = mapTierAmount(tier);

      // Create challenge and payment
      const challenge = await prismaAny.challenge.create({
        data: {
          userAddress: normalized,
          startDate,
          endDate,
          paid: false,
        },
      });

      const payment = await prismaAny.payment.create({
        data: {
          tier: tier as any,
          amount,
          currency: COINPAYMENTS_CURRENCY,
          confirmed: false,
          webhookReceived: false,
          challenge: { connect: { id: challenge.id } },
        },
      });

      await prismaAny.challenge.update({ where: { id: challenge.id }, data: { paymentId: payment.id } });

      // Try to create real CoinPayments transaction, else return mock
      let checkout_url = `${FRONTEND_URL}/checkout/${payment.id}`;
      let txn_id: string | undefined;
      try {
        const cp = await createCoinPaymentsTransaction({
          amount,
          currency2: COINPAYMENTS_CURRENCY,
          custom: payment.id,
          item_name: 'GoalCoin 90-Day Challenge',
          buyer_email: email,
        });
        if (cp) {
          checkout_url = cp.checkout_url;
          txn_id = cp.txn_id;
        }
      } catch (err) {
        console.warn('CoinPayments transaction failed or disabled, using mock:', (err as Error).message);
      }

      if (txn_id) {
        await prismaAny.payment.update({ where: { id: payment.id }, data: { coinpaymentsTxn: txn_id } });
      }

      res.status(200).json({
        success: true,
        challengeId: challenge.id,
        paymentId: payment.id,
        checkout_url,
      });
    } catch (error) {
      console.error('Error in checkout:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/payments/coinpayments-ipn (mounted before body parsers to capture raw body)
  async coinpaymentsIPN(req: Request, res: Response) {
    try {
      const hmacHeader = req.headers['hmac'] as string | undefined;
      if (!COINPAYMENTS_IPN_SECRET || !COINPAYMENTS_MERCHANT_ID) {
        res.status(500).send('IPN not configured');
        return;
      }
      if (!hmacHeader) {
        res.status(401).send('Missing HMAC');
        return;
      }

      const raw = (req as any).rawBody as string | undefined;
      if (!raw) {
        res.status(400).send('Raw body missing');
        return;
      }

      const computed = crypto.createHmac('sha512', COINPAYMENTS_IPN_SECRET).update(raw).digest('hex');
      if (computed !== hmacHeader) {
        res.status(401).send('HMAC mismatch');
        return;
      }

      const body: any = (req as any).body || {};

      if (!body.merchant || body.merchant !== COINPAYMENTS_MERCHANT_ID) {
        res.status(401).send('Invalid merchant');
        return;
      }

      const status = Number(body.status || 0); // 1=confirmed, 2=complete
      const txn_id = body.txn_id as string | undefined;
      const custom = body.custom as string | undefined; // our paymentId

      if (!txn_id && !custom) {
        res.status(400).send('Missing identifiers');
        return;
      }

      let payment = null as any;
      if (custom) {
        payment = await prismaAny.payment.findUnique({ where: { id: custom } });
      }
      if (!payment && txn_id) {
        payment = await prismaAny.payment.findFirst({ where: { coinpaymentsTxn: txn_id } });
      }
      if (!payment) {
        res.status(404).send('Payment not found');
        return;
      }

      // Update webhookReceived regardless
      await prismaAny.payment.update({ where: { id: payment.id }, data: { webhookReceived: true } });

      if (status >= 1 && !payment.confirmed) {
        await prisma.$transaction(async (tx) => {
          const txAny = tx as any;
          const updated = await txAny.payment.update({
            where: { id: payment!.id },
            data: { confirmed: true },
          });

          if (updated && updated.amount) {
            await splitRevenue(updated.id, updated.amount);
          }

          const ch = await txAny.challenge.findFirst({ where: { paymentId: updated.id } });
          if (ch) {
            await txAny.challenge.update({ where: { id: ch.id }, data: { paid: true } });
          }
        });
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error in CoinPayments IPN:', error);
      res.status(500).send('Internal error');
    }
  },

  // GET /api/payments/pools
  async pools(req: Request, res: Response) {
    try {
      const grouped = await prismaAny.revenueSplit.groupBy({
        by: ['pool'],
        _sum: { amount: true },
      });
      const result = {
        prize_pool: 0,
        treasury_pool: 0,
        burn_pool: 0,
        total_payments: await prismaAny.payment.count({ where: { confirmed: true } }),
      } as any;
      for (const g of grouped) {
        if (g.pool === 'PRIZE_POOL') result.prize_pool = g._sum.amount || 0;
        if (g.pool === 'TREASURY_POOL') result.treasury_pool = g._sum.amount || 0;
        if (g.pool === 'BURN_POOL') result.burn_pool = g._sum.amount || 0;
      }
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error fetching pools:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
