import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * Email/Password Authentication Controller
 */
export const authController = {
  /**
   * POST /api/auth/register
   * Register with email and password
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, handle, wallet, country_code, referral_code } = req.body;

      console.log('[REGISTER] New registration:', { email, has_referral: !!referral_code });

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Wallet is now optional - will be added in complete-profile step
      if (wallet) {
        // Validate wallet format only if provided (Ethereum address)
        if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
          res.status(400).json({ error: 'Invalid Ethereum wallet address format' });
          return;
        }
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Check if wallet already exists (only if wallet provided)
      if (wallet) {
        const existingWallet = await prisma.user.findUnique({
          where: { wallet },
        });

        if (existingWallet) {
          res.status(400).json({ error: 'Wallet address already registered' });
          return;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          wallet: wallet || null,
          handle: handle || null,
          country_code: country_code || null,
          email_verified: false,
          tier: 'FAN',
          founder_nft: false,
          xp_points: 0,
          goal_points: 0,
          current_streak: 0,
          longest_streak: 0,
          burn_multiplier: 1.0,
          is_holder: false,
          micro_goal_points: 0,
        },
      });

      // Handle referral if provided
      if (referral_code) {
        try {
          console.log('[REFERRAL] Processing referral code:', referral_code);
          
          // Find referrer by handle
          const referrer = await prisma.user.findFirst({
            where: { handle: referral_code },
            select: { id: true, handle: true },
          });

          if (referrer) {
            // Create referral record
            await prisma.referral.create({
              data: {
                referrer_id: referrer.id,
                referred_id: user.id,
                status: 'pending', // Will be activated when user completes first action
              },
            });
            console.log('[REFERRAL] Referral created:', { referrer: referrer.handle, referred: user.id });
          } else {
            console.log('[REFERRAL] Referrer not found:', referral_code);
          }
        } catch (refError) {
          console.error('[REFERRAL] Error creating referral:', refError);
          // Don't fail registration if referral fails
        }
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // TODO: Send verification email
      // For MVP, we'll skip email sending and auto-verify

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          tier: user.tier,
        },
      });
    } catch (error) {
      console.error('Error in register:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/test-login
   * Simple test login for UAT without Web3 (MVP only)
   */
  async testLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user by email with explicit select
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password_hash: true,
          wallet: true,
          handle: true,
          tier: true,
          xp_points: true,
          goal_points: true,
          current_streak: true,
          country_code: true,
        },
      });

      if (!user || !user.password_hash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, wallet: user.wallet },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          wallet: user.wallet,
          tier: user.tier,
          xp_points: user.xp_points,
          goal_points: user.goal_points,
          current_streak: user.current_streak,
        },
      });
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('[LOGIN] Starting login attempt for:', req.body.email);
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('[LOGIN] Missing email or password');
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user with explicit select to avoid fan_tier ENUM issues
      console.log('[LOGIN] Querying database for user:', email);
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password_hash: true,
          wallet: true,
          handle: true,
          tier: true,
          xp_points: true,
          goal_points: true,
          current_streak: true,
          longest_streak: true,
          country_code: true,
          email_verified: true,
        },
      });

      if (!user || !user.password_hash) {
        console.log('[LOGIN] User not found or no password hash');
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      console.log('[LOGIN] User found, verifying password');
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        console.log('[LOGIN] Invalid password');
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      console.log('[LOGIN] Password valid, generating JWT');
      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('[LOGIN] Login successful for user:', user.id);
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          wallet: user.wallet,
          handle: user.handle,
          tier: user.tier,
          xp_points: user.xp_points,
          current_streak: user.current_streak,
          country_code: user.country_code,
          email_verified: user.email_verified,
        },
      });
    } catch (error) {
      console.error('[LOGIN] Error in login:', error);
      console.error('[LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/link-wallet
   * Link wallet to existing email account
   */
  async linkWallet(req: Request, res: Response): Promise<void> {
    try {
      const { email, wallet } = req.body;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.substring(7);
      let decoded: any;

      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address is required' });
        return;
      }

      // Check if wallet already linked to another account
      const existingWallet = await prisma.user.findUnique({
        where: { wallet: wallet.toLowerCase() },
      });

      if (existingWallet && existingWallet.id !== decoded.userId) {
        res.status(400).json({ error: 'Wallet already linked to another account' });
        return;
      }

      // Update user with wallet
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { wallet: wallet.toLowerCase() },
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          wallet: user.wallet,
        },
      });
    } catch (error) {
      console.error('Error in linkWallet:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/auth/me
   * Get current user info
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.substring(7);
      let decoded: any;

      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          wallet: true,
          handle: true,
          country_code: true,
          tier: true,
          founder_nft: true,
          xp_points: true,
          goal_points: true,
          current_streak: true,
          longest_streak: true,
          created_at: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('Error in getMe:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default authController;
