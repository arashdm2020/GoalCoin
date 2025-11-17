import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MembershipController {
  /**
   * Get all memberships with filters and pagination
   */
  async getMemberships(req: Request, res: Response): Promise<void> {
    console.log('[MEMBERSHIPS] getMemberships called');
    try {
      const { 
        page = '1', 
        limit = '25', 
        tier, 
        status, 
        country, 
        search 
      } = req.query;
      
      console.log('[MEMBERSHIPS] Query params:', { page, limit, tier, status, country, search });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for payments
      const paymentWhere: any = {};
      
      if (tier && tier !== 'all') {
        paymentWhere.tier = tier;
      }
      
      if (status && status !== 'all') {
        const statusStr = String(status);
        paymentWhere.status = statusStr === 'PAID' ? 'confirmed' : statusStr.toLowerCase();
      }

      // Build where clause for user search
      const userWhere: any = {};
      
      if (country && country !== 'all') {
        userWhere.country_code = country;
      }
      
      if (search) {
        userWhere.OR = [
          { handle: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { wallet: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get payments with user data
      const payments = await prisma.payment.findMany({
        where: {
          ...paymentWhere,
          user: userWhere,
        },
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              email: true,
              wallet: true,
              country_code: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      });

      // Get total count
      const totalCount = await prisma.payment.count({
        where: {
          ...paymentWhere,
          user: userWhere,
        },
      });

      const totalPages = Math.ceil(totalCount / limitNum);

      // Map to response format
      const formattedMemberships = payments.map(p => ({
        id: p.id,
        user_id: p.user_id,
        username: p.user.handle || 'Unknown',
        email: p.user.email || 'N/A',
        wallet_address: p.user.wallet,
        tier: p.tier,
        tier_price: p.amount,
        payment_method: 'COINPAYMENTS',
        payment_status: p.status === 'confirmed' ? 'PAID' : p.status === 'pending' ? 'PENDING' : 'FAILED',
        transaction_id: p.tx_id,
        amount_paid: p.amount,
        country: p.user.country_code,
        joined_at: p.created_at,
      }));

      res.status(200).json({
        success: true,
        memberships: formattedMemberships,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
        },
      });
    } catch (error: any) {
      console.error('[MEMBERSHIPS] Error fetching memberships:', error);
      res.status(500).json({ 
        error: 'Failed to fetch memberships', 
        details: error.message 
      });
    }
  }

  /**
   * Get membership statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    console.log('[MEMBERSHIPS] getStats called');
    try {
      // Total members (unique users with payments)
      const total_members = await prisma.payment.groupBy({
        by: ['user_id'],
      });

      // Status counts
      const paid_count = await prisma.payment.count({
        where: { status: 'confirmed' },
      });

      const pending_count = await prisma.payment.count({
        where: { status: 'pending' },
      });

      const failed_count = await prisma.payment.count({
        where: { status: 'failed' },
      });

      // Total revenue (only confirmed)
      const revenueResult = await prisma.payment.aggregate({
        where: { status: 'confirmed' },
        _sum: {
          amount: true,
        },
      });

      const total_revenue = revenueResult._sum.amount || 0;

      res.status(200).json({
        success: true,
        stats: {
          total_members: total_members.length,
          total_revenue,
          paid_count,
          pending_count,
          failed_count,
        },
      });
    } catch (error: any) {
      console.error('[MEMBERSHIPS] Error fetching stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch stats', 
        details: error.message 
      });
    }
  }

  /**
   * Export memberships to CSV
   */
  async exportCSV(req: Request, res: Response): Promise<void> {
    try {
      const { tier, status, country, search } = req.query;

      // Build where clause
      const paymentWhere: any = {};
      if (tier && tier !== 'all') paymentWhere.tier = tier;
      if (status && status !== 'all') {
        const statusStr = String(status);
        paymentWhere.status = statusStr === 'PAID' ? 'confirmed' : statusStr.toLowerCase();
      }

      const userWhere: any = {};
      if (country && country !== 'all') userWhere.country_code = country;
      
      if (search) {
        userWhere.OR = [
          { handle: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { wallet: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const payments = await prisma.payment.findMany({
        where: {
          ...paymentWhere,
          user: userWhere,
        },
        include: {
          user: {
            select: {
              handle: true,
              email: true,
              wallet: true,
              country_code: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // Generate CSV
      const headers = [
        'Username',
        'Email',
        'Wallet Address',
        'Tier',
        'Amount Paid',
        'Payment Status',
        'Payment Method',
        'Transaction ID',
        'Country',
        'Joined Date',
      ];

      const rows = payments.map(p => [
        p.user.handle || 'Unknown',
        p.user.email || 'N/A',
        p.user.wallet || '',
        p.tier,
        p.amount,
        p.status === 'confirmed' ? 'PAID' : p.status.toUpperCase(),
        'COINPAYMENTS',
        p.tx_id,
        p.user.country_code || '',
        new Date(p.created_at).toISOString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="memberships_${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csv);
    } catch (error: any) {
      console.error('[MEMBERSHIPS] Error exporting CSV:', error);
      res.status(500).json({ 
        error: 'Failed to export CSV', 
        details: error.message 
      });
    }
  }

  /**
   * Update payment status (manual override)
   */
  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId, status } = req.body;

      if (!paymentId || !status) {
        res.status(400).json({ error: 'Payment ID and status are required' });
        return;
      }

      const validStatuses = ['confirmed', 'pending', 'failed'];
      if (!validStatuses.includes(status.toLowerCase())) {
        res.status(400).json({ error: 'Invalid payment status' });
        return;
      }

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: status.toLowerCase(),
          ...(status.toLowerCase() === 'confirmed' && { paid_at: new Date() }),
        },
      });

      res.status(200).json({ 
        success: true, 
        message: 'Payment status updated successfully' 
      });
    } catch (error: any) {
      console.error('[MEMBERSHIPS] Error updating payment status:', error);
      res.status(500).json({ 
        error: 'Failed to update payment status', 
        details: error.message 
      });
    }
  }
}

export default new MembershipController();
