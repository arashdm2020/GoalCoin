import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { userRoutes } from './routes/userRoutes';
import { adminRoutes } from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - allow localhost:3000 and staging URL
const allowedOrigins = [
  'https://localhost:3000',
  'http://localhost:3000',
  'https://goal-coin.vercel.app', // Production Frontend
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

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
  // In production (like on Render), start a simple HTTP server.
  // Render handles SSL termination.
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
