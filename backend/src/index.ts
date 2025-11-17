import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
// Schema updated with fan_tier field
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
import uploadRoutes from './routes/uploadRoutes';
import setupRoutes from './routes/setupRoutes';
import fixUrlsRoutes from './routes/fixUrls';
import notificationRoutes from './routes/notificationRoutes';
import membershipRoutes from './routes/membershipRoutes';
import { apiLimiter, authLimiter, xpLimiter, adminLimiter } from './middleware/rateLimiter';
import cron from 'node-cron';
import { CronService } from './services/cronService';
// Temporarily disable BullMQ workers and Redis to avoid limit exceeded
// import './queue/workers'; 
console.log('⚠️ BullMQ workers and Redis disabled - limit exceeded');
// await startWorkers();
console.log('✅ Server started without Redis/workers (UAT mode)');
const prisma = new PrismaClient();

// Initialize main challenge on startup
async function initializeMainChallenge() {
  try {
    const existing = await prisma.challenge.findUnique({
      where: { id: 'main-challenge' },
    });

    if (!existing) {
      console.log('🔧 Creating main challenge...');
      const challenge = await prisma.challenge.create({
        data: {
          id: 'main-challenge',
          title: '13-Week Transformation Challenge',
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-12-31'),
          rules: 'Complete 13 weeks of fitness and nutrition goals',
          active: true,
        },
      });
      console.log('✅ Main challenge created:', challenge.id);
    } else {
      console.log('✅ Main challenge already exists:', existing.id);
    }
  } catch (error) {
    console.error('❌ Failed to initialize main challenge:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render.com deployment
app.set('trust proxy', 1);

// Security middleware - disable some features that interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow specific origins and all methods
const allowedOrigins = [
  'https://goal-coin.vercel.app',
  'https://goalcoin.onrender.com',
  'http://localhost:3000',
  'https://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // In production, still allow for now to debug
        console.log('⚠️ CORS: Origin not in whitelist:', origin);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers for preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://goal-coin.vercel.app');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

app.use('/api/webhooks', webhooksRoutes);
app.use('/api/payments', paymentRoutes);
// Add extra CORS headers for admin routes
app.use('/api/admin', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://goal-coin.vercel.app');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  next();
}, adminRoutes);
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
app.use('/api/upload', uploadRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/admin/memberships', membershipRoutes);
app.use('/api/rate-limits', adminLimiter, rateLimitRoutes);
app.use('/api/email-test', adminLimiter, emailTestRoutes);
app.use('/api/migration', adminLimiter, migrationRoutes);
app.use('/api/fix', adminLimiter, fixUrlsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/streak', require('./routes/streakRoutes').streakRoutes);
app.use('/api/country', require('./routes/countryRoutes').countryRoutes);

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
async function startServer() {
  // Initialize main challenge before starting server
  await initializeMainChallenge();

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
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
