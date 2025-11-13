import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { webhooksRoutes } from './routes/webhooksRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { submissionRoutes } from './routes/submissionRoutes';
import { reviewRoutes } from './routes/reviewRoutes';
import { leaderboardRoutes } from './routes/leaderboardRoutes';
import { userRoutes } from './routes/userRoutes';
import { challengeRoutes } from './routes/challengeRoutes';
import { fitnessRoutes } from './routes/fitnessRoutes';
import { utilityBridgeRoutes } from './routes/utilityBridgeRoutes';
import { daoRoutes } from './routes/daoRoutes';
import { debugRoutes } from './routes/debugRoutes';
import { authRoutes } from './routes/authRoutes';
import { shopifyRoutes } from './routes/shopifyRoutes';
import { stakingRoutes } from './routes/stakingRoutes';
import { xpRoutes } from './routes/xpRoutes';
import { countryLeaderboardRoutes } from './routes/countryLeaderboardRoutes';
import { scoreboardRoutes } from './routes/scoreboardRoutes';
import { treasuryRoutes } from './routes/treasuryRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { adminAuthTestRoutes } from './routes/adminAuthTestRoutes';
import { settingsRoutes } from './routes/settingsRoutes';
import { migrationRoutes } from './routes/migrationRoutes';
import warmupRoutes from './routes/warmupRoutes';
import mealRoutes from './routes/mealRoutes';
import referralRoutes from './routes/referralRoutes';
import scoreboardWidgetRoutes from './routes/scoreboardWidgetRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import nftRoutes from './routes/nftRoutes';
import { rateLimitRoutes } from './routes/rateLimitRoutes';
import { emailTestRoutes } from './routes/emailTestRoutes';
import { apiLimiter, authLimiter, xpLimiter, adminLimiter } from './middleware/rateLimiter';
import cron from 'node-cron';
import { CronService } from './services/cronService';
import './queue/workers'; // Start BullMQ workers

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render.com deployment
app.set('trust proxy', 1);

// Security middleware - disable some features that interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📥 ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  next();
});

// Special raw body parser for CoinPayments webhook
app.use('/api/webhooks/coinpayments', express.raw({ type: 'application/x-www-form-urlencoded' }), (req, res, next) => {
  (req as any).rawBody = req.body.toString();
  try {
    const parsed: Record<string, string> = {};
    const usp = new URLSearchParams((req as any).rawBody);
    usp.forEach((v, k) => { parsed[k] = v; });
    req.body = parsed;
  } catch (e) {
    req.body = {};
  }
  next();
});



// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

app.use('/api/webhooks', webhooksRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/utility-bridge', utilityBridgeRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/xp', xpLimiter, xpRoutes);
app.use('/api/leaderboards', countryLeaderboardRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/dev', healthRoutes);
app.use('/api/admin-test', adminAuthTestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/warmups', warmupRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/widgets', scoreboardWidgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/rate-limits', adminLimiter, rateLimitRoutes);
app.use('/api/email-test', adminLimiter, emailTestRoutes);
app.use('/api/migration', adminLimiter, migrationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes

// Cron jobs for automated tasks
// Reassign expired assignments every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running expired assignment reassignment...');
    const result = await CronService.reassignExpiredAssignments();
    console.log(`Reassigned ${result.reassigned} expired assignments`);
  } catch (error) {
    console.error('Error in reassignment cron job:', error);
  }
});

// Compute accuracy and auto-suspend reviewers daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Computing reviewer accuracy and auto-suspending...');
    const result = await CronService.computeAccuracyAndSuspend();
    console.log(`Processed accuracy for ${result.processed} reviewers`);
    
    const unsuspendResult = await CronService.unsuspendReviewers();
    console.log(`Unsuspended ${unsuspendResult.unsuspended} reviewers`);
  } catch (error) {
    console.error('Error in accuracy computation cron job:', error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server based on environment
if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
} else {
  // In development, start an HTTPS server for a local setup.
  const projectRoot = path.join(__dirname, '../..');
  const sslPath = path.join(projectRoot, 'ssl');
  const frontendSslPath = path.join(projectRoot, 'frontend/ssl');

  let keyPath = path.join(sslPath, 'localhost+2-key.pem');
  let certPath = path.join(sslPath, 'localhost+2.pem');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    keyPath = path.join(frontendSslPath, 'localhost-key.pem');
    certPath = path.join(frontendSslPath, 'localhost-cert.pem');
  }

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`HTTPS Server running on https://localhost:${PORT}`);
    });
  } else {
    console.warn('SSL certificates not found. Starting HTTP server for development.');
    app.listen(PORT, () => {
      console.log(`HTTP Server running on http://localhost:${PORT}`);
    });
  }
}
