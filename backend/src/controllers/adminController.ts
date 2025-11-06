import { Request, Response } from 'express';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

/**
 * GET /api/admin/users
 * Returns all users ordered by latest connection timestamp
 */
export const adminController = {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
                  const allUsers = await prisma.user.findMany({
        orderBy: {
          lastSeen: 'desc',
        },
      });

      // Define thresholds based on environment
      const isDemo = process.env.NODE_ENV !== 'production';
      const thresholds = {
        active: isDemo ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 mins in demo, 24h in prod
        dormant: isDemo ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 60 mins in demo, 7d in prod
      };

      const now = Date.now();

      const usersWithStatus = allUsers.map(user => {
        const timeDiff = now - new Date(user.lastSeen).getTime();
        let status: 'Active' | 'Dormant' | 'Inactive';

        if (user.online || timeDiff < thresholds.active) {
          status = 'Active';
        } else if (timeDiff < thresholds.dormant) {
          status = 'Dormant';
        } else {
          status = 'Inactive';
        }

        return { ...user, status };
      });

      res.status(200).json({
        success: true,
        count: usersWithStatus.length,
        users: usersWithStatus,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async getVerifiers(req: Request, res: Response): Promise<void> {
    try {
      const verifiers = await prismaAny.verifier.findMany({ orderBy: { name: 'asc' } });
      res.status(200).json({ success: true, verifiers });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async createVerifier(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, name, active } = req.body as { walletAddress: string; name?: string; active?: boolean };
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({ error: 'Valid walletAddress required' });
        return;
      }
      const v = await prismaAny.verifier.upsert({
        where: { walletAddress: walletAddress.toLowerCase() },
        update: { name: name ?? undefined, active: active ?? undefined },
        create: { walletAddress: walletAddress.toLowerCase(), name: name ?? null, active: active ?? true },
      });
      res.status(200).json({ success: true, verifier: v });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { verifierId, subjectType, subjectId, approved } = req.body as { verifierId: string; subjectType: string; subjectId: string; approved: boolean };
      if (!verifierId || !subjectType || !subjectId || typeof approved !== 'boolean') {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }
      const verifier = await prismaAny.verifier.findUnique({ where: { id: verifierId } });
      if (!verifier || !verifier.active) {
        res.status(400).json({ error: 'Invalid verifier' });
        return;
      }
      const existing = await prismaAny.verification.findFirst({ where: { verifierId, subjectType, subjectId } });
      if (existing) {
        const updated = await prismaAny.verification.update({ where: { id: existing.id }, data: { approved } });
        await evaluateQuorumAndCommissions(subjectType, subjectId);
        res.status(200).json({ success: true, verification: updated });
        return;
      }
      const verification = await prismaAny.verification.create({ data: { verifierId, subjectType, subjectId, approved } });
      await evaluateQuorumAndCommissions(subjectType, subjectId);
      res.status(200).json({ success: true, verification });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async verificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { subjectType, subjectId } = req.query as { subjectType?: string; subjectId?: string };
      if (!subjectType || !subjectId) {
        res.status(400).json({ error: 'subjectType and subjectId required' });
        return;
      }
      const all = await prismaAny.verification.findMany({ where: { subjectType, subjectId } });
      const approved = all.filter((v: any) => v.approved).length;
      const rejected = all.filter((v: any) => v.approved === false).length;
      const quorum = Number(process.env.VERIFICATION_QUORUM || 3);
      const quorumReached = approved >= quorum;
      res.status(200).json({ success: true, approved, rejected, total: all.length, quorum, quorumReached });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async commissions(req: Request, res: Response): Promise<void> {
    try {
      const { verifierId } = req.query as { verifierId?: string };
      const list = await prismaAny.commission.findMany({ where: verifierId ? { verifierId } : undefined, orderBy: { createdAt: 'desc' } });
      res.status(200).json({ success: true, commissions: list });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

async function evaluateQuorumAndCommissions(subjectType: string, subjectId: string): Promise<void> {
  const quorum = Number(process.env.VERIFICATION_QUORUM || 3);
  const approvals = await prismaAny.verification.findMany({ where: { subjectType, subjectId, approved: true } });
  if (approvals.length < quorum) return;
  if (subjectType.toLowerCase() !== 'payment') return;
  const payment = await prismaAny.payment.findUnique({ where: { id: subjectId } });
  if (!payment) return;
  const existing = await prismaAny.commission.findMany({ where: { paymentId: payment.id } });
  if (existing.length > 0) return;
  const perVerifier = Number(process.env.VERIFIER_COMMISSION_AMOUNT || 0);
  if (perVerifier <= 0) return;
  await prisma.$transaction(
    approvals.slice(0, quorum).map((v: any) =>
      prismaAny.commission.create({ data: { verifierId: v.verifierId, paymentId: payment.id, amount: perVerifier } })
    )
  );
}
