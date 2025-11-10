/**
 * Email Service using Mailgun
 * Handles all email sending operations
 */

import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const MAILGUN_REGION = process.env.MAILGUN_REGION || 'eu'; // EU region as per James
const FROM_EMAIL = process.env.FROM_EMAIL || `GoalCoin <noreply@${MAILGUN_DOMAIN}>`;

// Initialize Mailgun client
const mg = MAILGUN_API_KEY ? mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
}) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}

class EmailService {
  /**
   * Send email via Mailgun
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    if (!mg) {
      console.warn('[Email] Mailgun not configured, skipping email send');
      return { success: false, message: 'Mailgun not configured' };
    }

    try {
      const result = await mg.messages.create(MAILGUN_DOMAIN, {
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        'o:tag': options.tags || [],
        'o:tracking': true,
        'o:tracking-clicks': true,
        'o:tracking-opens': true,
      });

      console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: result.id };
    } catch (error: any) {
      console.error('[Email] Error sending:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<any> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Welcome to GoalCoin!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thanks for signing up! Please verify your email address to get started with your 90-Day Challenge.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GoalCoin. All rights reserved.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify your GoalCoin account',
      html,
      tags: ['verification', 'onboarding'],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<any> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request this, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GoalCoin. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Reset your GoalCoin password',
      html,
      tags: ['password-reset', 'security'],
    });
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(email: string, stats: any): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
          .stat-label { color: #666; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Progress</h1>
          </div>
          <div class="content">
            <h2>Great work this week!</h2>
            <p>Here's a summary of your GoalCoin journey:</p>
            
            <div class="stat-box">
              <div class="stat-value">${stats.xpEarned || 0}</div>
              <div class="stat-label">XP Earned This Week</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-value">${stats.currentStreak || 0} 🔥</div>
              <div class="stat-label">Current Streak</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-value">${stats.tier || 'MINTED'}</div>
              <div class="stat-label">Current Tier</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-value">#${stats.rank || 'N/A'}</div>
              <div class="stat-label">Global Rank</div>
            </div>
            
            <p style="margin-top: 30px;">Keep up the momentum! 💪</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GoalCoin. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL}/settings">Unsubscribe</a> from weekly emails</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `Your GoalCoin Weekly Progress - ${stats.xpEarned || 0} XP Earned!`,
      html,
      tags: ['weekly-digest', 'engagement'],
    });
  }

  /**
   * Send admin alert email
   */
  async sendAdminAlert(email: string, alert: any): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Admin Alert</h1>
          </div>
          <div class="content">
            <h2>${alert.title}</h2>
            <div class="alert-box">
              <p><strong>Message:</strong> ${alert.message}</p>
              ${alert.details ? `<p><strong>Details:</strong> ${alert.details}</p>` : ''}
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GoalCoin Admin System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `🚨 GoalCoin Alert: ${alert.title}`,
      html,
      tags: ['admin-alert', 'critical'],
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!mg) {
      console.error('[Email] Mailgun not configured');
      return false;
    }

    try {
      // Validate domain
      await mg.domains.get(MAILGUN_DOMAIN);
      console.log('[Email] Mailgun connection successful');
      return true;
    } catch (error: any) {
      console.error('[Email] Mailgun connection failed:', error.message);
      return false;
    }
  }
}

export const emailService = new EmailService();
