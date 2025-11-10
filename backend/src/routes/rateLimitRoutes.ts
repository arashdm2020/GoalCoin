/**
 * Rate Limit Monitoring Routes
 * Admin dashboard for rate limit monitoring
 */

import express from 'express';
import { rateLimitMonitorService } from '../services/rateLimitMonitorService';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = express.Router();

/**
 * GET /api/rate-limits/stats
 * Get rate limit statistics
 */
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const stats = await rateLimitMonitorService.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('[Rate Limit Stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/rate-limits/violations
 * Get recent violations
 */
router.get('/violations', adminAuthMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const violations = await rateLimitMonitorService.getRecentViolations(hours, limit);
    res.json(violations);
  } catch (error: any) {
    console.error('[Rate Limit Violations] Error:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

/**
 * GET /api/rate-limits/violations/ip/:ip
 * Get violations by specific IP
 */
router.get('/violations/ip/:ip', adminAuthMiddleware, async (req, res) => {
  try {
    const { ip } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const violations = await rateLimitMonitorService.getViolationsByIP(ip, limit);
    res.json(violations);
  } catch (error: any) {
    console.error('[Rate Limit IP Violations] Error:', error);
    res.status(500).json({ error: 'Failed to fetch IP violations' });
  }
});

/**
 * GET /api/rate-limits/offenders
 * Get top offenders
 */
router.get('/offenders', adminAuthMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offenders = await rateLimitMonitorService.getTopOffenders(limit);
    res.json(offenders);
  } catch (error: any) {
    console.error('[Rate Limit Offenders] Error:', error);
    res.status(500).json({ error: 'Failed to fetch offenders' });
  }
});

/**
 * GET /api/rate-limits/endpoints
 * Get violations by endpoint
 */
router.get('/endpoints', adminAuthMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const endpoints = await rateLimitMonitorService.getViolationsByEndpoint(hours);
    res.json(endpoints);
  } catch (error: any) {
    console.error('[Rate Limit Endpoints] Error:', error);
    res.status(500).json({ error: 'Failed to fetch endpoint stats' });
  }
});

/**
 * GET /api/rate-limits/blocked
 * Get blocked IPs
 */
router.get('/blocked', adminAuthMiddleware, async (req, res) => {
  try {
    const blocked = await rateLimitMonitorService.getBlockedIPs();
    res.json(blocked);
  } catch (error: any) {
    console.error('[Rate Limit Blocked] Error:', error);
    res.status(500).json({ error: 'Failed to fetch blocked IPs' });
  }
});

/**
 * POST /api/rate-limits/block
 * Block an IP address
 */
router.post('/block', adminAuthMiddleware, async (req, res) => {
  try {
    const { ip, reason, expiresInHours } = req.body;

    if (!ip || !reason) {
      res.status(400).json({ error: 'IP and reason are required' });
      return;
    }

    await rateLimitMonitorService.blockIP(ip, reason, expiresInHours);
    res.json({ success: true, message: `IP ${ip} blocked` });
  } catch (error: any) {
    console.error('[Rate Limit Block] Error:', error);
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

/**
 * DELETE /api/rate-limits/unblock/:ip
 * Unblock an IP address
 */
router.delete('/unblock/:ip', adminAuthMiddleware, async (req, res) => {
  try {
    const { ip } = req.params;
    await rateLimitMonitorService.unblockIP(ip);
    res.json({ success: true, message: `IP ${ip} unblocked` });
  } catch (error: any) {
    console.error('[Rate Limit Unblock] Error:', error);
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

/**
 * POST /api/rate-limits/cleanup
 * Clean old violations
 */
router.post('/cleanup', adminAuthMiddleware, async (req, res) => {
  try {
    const deleted = await rateLimitMonitorService.cleanOldViolations();
    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('[Rate Limit Cleanup] Error:', error);
    res.status(500).json({ error: 'Failed to cleanup violations' });
  }
});

export const rateLimitRoutes = router;
