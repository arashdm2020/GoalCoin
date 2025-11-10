/**
 * Queue Job Helpers
 * Easy functions to add jobs to queues
 */

import { queues } from './queues';

/**
 * Email Jobs
 */
export const emailJobs = {
  async sendVerification(email: string, token: string) {
    return await queues.email.add('verification', {
      to: email,
      subject: 'Verify your GoalCoin account',
      template: 'verification',
      data: { token },
    });
  },

  async sendPasswordReset(email: string, token: string) {
    return await queues.email.add('password-reset', {
      to: email,
      subject: 'Reset your GoalCoin password',
      template: 'password-reset',
      data: { token },
    });
  },

  async sendWeeklyDigest(email: string, stats: any) {
    return await queues.email.add('weekly-digest', {
      to: email,
      subject: 'Your weekly GoalCoin progress',
      template: 'weekly-digest',
      data: stats,
    });
  },

  async sendAdminAlert(email: string, alert: any) {
    return await queues.email.add('admin-alert', {
      to: email,
      subject: `GoalCoin Alert: ${alert.title}`,
      template: 'admin-alert',
      data: alert,
    }, {
      priority: 1, // High priority
    });
  },
};

/**
 * XP Event Jobs
 */
export const xpJobs = {
  async awardXP(userId: string, actionKey: string, metadata?: any) {
    return await queues.xpEvents.add('award-xp', {
      userId,
      actionKey,
      metadata,
      idempotencyKey: `${userId}-${actionKey}-${Date.now()}`,
    });
  },
};

/**
 * Webhook Jobs
 */
export const webhookJobs = {
  async processCoinPayments(payload: any, signature?: string) {
    return await queues.webhooks.add('coinpayments', {
      source: 'coinpayments',
      event: 'payment',
      payload,
      signature,
    });
  },

  async processShopify(event: string, payload: any, signature?: string) {
    return await queues.webhooks.add('shopify', {
      source: 'shopify',
      event,
      payload,
      signature,
    });
  },
};

/**
 * Notification Jobs
 */
export const notificationJobs = {
  async tierUpgrade(userId: string, newTier: string) {
    return await queues.notifications.add('tier-upgrade', {
      userId,
      type: 'tier-upgrade',
      title: 'Tier Upgrade!',
      message: `Congratulations! You've been promoted to ${newTier}`,
      data: { newTier },
    });
  },

  async streakMilestone(userId: string, streak: number) {
    return await queues.notifications.add('streak-milestone', {
      userId,
      type: 'streak-milestone',
      title: 'Streak Milestone!',
      message: `Amazing! You've reached a ${streak}-day streak!`,
      data: { streak },
    });
  },

  async challengeReminder(userId: string) {
    return await queues.notifications.add('challenge-reminder', {
      userId,
      type: 'challenge-reminder',
      title: 'Daily Challenge',
      message: "Don't forget to complete today's challenge!",
    });
  },

  async burnEvent(userId: string, amount: number) {
    return await queues.notifications.add('burn-event', {
      userId,
      type: 'burn-event',
      title: 'Burn Event',
      message: `${amount} GoalCoin burned! Your contribution made a difference.`,
      data: { amount },
    });
  },
};

export default {
  email: emailJobs,
  xp: xpJobs,
  webhooks: webhookJobs,
  notifications: notificationJobs,
};
