import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const COINPAYMENTS_IPN_SECRET = process.env.COINPAYMENTS_IPN_SECRET || '';

export const webhooksController = {
  async coinpayments(req: Request, res: Response): Promise<void> {
    const hmac = req.headers['hmac'] as string | undefined;
    const rawBody = (req as any).rawBody || '';

    if (!hmac || !rawBody) {
      res.status(400).send('Missing HMAC or body');
      return;
    }

    const expectedHmac = crypto.createHmac('sha512', COINPAYMENTS_IPN_SECRET).update(rawBody).digest('hex');

    if (hmac !== expectedHmac) {
      res.status(401).send('Invalid HMAC');
      return;
    }

    try {
      const body = req.body;
      const txn_id = body.txn_id as string;
      const status = Number(body.status || 0);
      const amount = parseFloat(body.amount1 || '0');
      const payment = await prisma.payment.findUnique({ where: { tx_id: txn_id } });

      if (!payment) {
        // This could be a payment for something else, or an attack. Ignore.
        res.status(200).send('OK');
        return;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { raw_webhook: body as any },
      });

      if (status >= 100 || status === 2) { // 100 = complete, 2 = complete for older API
        if (payment.status !== 'confirmed') {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'confirmed',
                paid_at: new Date(),
              },
            });

            await tx.poolsLedger.create({
              data: {
                payment_id: payment.id,
                prize_usdt: amount * 0.7,
                treasury_usdt: amount * 0.2,
                burn_usdt: amount * 0.1,
              },
            });

            await tx.user.update({
              where: { id: payment.user_id },
              data: { tier: 'PLAYER' }, // Or map from payment.tier
            });
          });
        }
      } else if (status < 0) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing CoinPayments IPN:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};
