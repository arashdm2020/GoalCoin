/**
 * Email Test Routes
 * For testing Mailgun integration
 */

import express from 'express';
import { emailService } from '../services/emailService';
import { emailJobs } from '../queue/jobs';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = express.Router();

/**
 * GET /api/email-test/connection
 * Test Mailgun connection
 */
router.get('/connection', adminAuthMiddleware, async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    res.json({ 
      success: isConnected,
      message: isConnected ? 'Mailgun connected successfully' : 'Mailgun not configured or connection failed'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/email-test/send
 * Send test email
 */
router.post('/send', adminAuthMiddleware, async (req, res) => {
  try {
    const { email, template = 'verification' } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    let result;

    switch (template) {
      case 'verification':
        result = await emailService.sendVerificationEmail(email, 'test-token-123');
        break;

      case 'password-reset':
        result = await emailService.sendPasswordResetEmail(email, 'reset-token-456');
        break;

      case 'weekly-digest':
        result = await emailService.sendWeeklyDigest(email, {
          xpEarned: 1250,
          currentStreak: 7,
          tier: 'STAKED',
          rank: 42,
        });
        break;

      case 'admin-alert':
        result = await emailService.sendAdminAlert(email, {
          title: 'Test Alert',
          message: 'This is a test admin alert',
          details: 'Everything is working correctly!',
        });
        break;

      default:
        res.status(400).json({ error: 'Invalid template' });
        return;
    }

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/email-test/queue
 * Test email queue
 */
router.post('/queue', adminAuthMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Queue test emails
    const jobs = await Promise.all([
      emailJobs.sendVerification(email, 'queued-token-123'),
      emailJobs.sendWeeklyDigest(email, {
        xpEarned: 500,
        currentStreak: 3,
        tier: 'MINTED',
        rank: 100,
      }),
    ]);

    res.json({ 
      success: true, 
      message: 'Test emails queued',
      jobIds: jobs.map(j => j.id),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const emailTestRoutes = router;
