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
  process.env.FRONTEND_URL || 'https://staging.goalcoin.io'
].filter(Boolean);

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

// SSL Configuration
// In development, __dirname points to src/, in production to dist/
const projectRoot = path.join(__dirname, '../..');
const sslPath = path.join(projectRoot, 'ssl');
const frontendSslPath = path.join(projectRoot, 'frontend/ssl');

console.log('Looking for SSL certificates...');
console.log('   Backend SSL path:', sslPath);
console.log('   Frontend SSL path:', frontendSslPath);

// Priority 1: Try mkcert certificates (trusted)
let keyPath = path.join(sslPath, 'localhost+2-key.pem');
let certPath = path.join(sslPath, 'localhost+2.pem');

// Priority 2: Try frontend mkcert certificates
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  keyPath = path.join(frontendSslPath, 'localhost+2-key.pem');
  certPath = path.join(frontendSslPath, 'localhost+2.pem');
}

// Priority 3: Try self-signed certificates
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  keyPath = path.join(sslPath, 'localhost-key.pem');
  certPath = path.join(sslPath, 'localhost-cert.pem');
}

// Priority 4: Try frontend self-signed certificates
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  keyPath = path.join(frontendSslPath, 'localhost-key.pem');
  certPath = path.join(frontendSslPath, 'localhost-cert.pem');
}

// HTTPS Configuration
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    console.log('Loading SSL certificates...');
    
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    const server = https.createServer(httpsOptions, app);
    
    server.on('error', (err: any) => {
      console.error('HTTPS Server Error:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`   Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      console.log(`HTTPS Server running on https://localhost:${PORT}`);
      
      const usingMkcert = certPath.includes('localhost+2');
      if (usingMkcert) {
        console.log('Using locally trusted certificate (mkcert)');
      } else {
        console.log('Warning: Using self-signed certificate');
      }
      console.log(`Certificate: ${certPath}`);
      console.log(`Private Key: ${keyPath}`);
    });
  } catch (error: any) {
    console.error('Failed to start HTTPS server:', error.message);
    console.error('   Error details:', error.stack);
    process.exit(1);
  }
} else {
  console.error('SSL certificates not found!');
  console.error('   Checked paths:');
  console.error('   - Certificate:', certPath);
  console.error('   - Private Key:', keyPath);
  console.error('');
  console.error('Please run mkcert to generate trusted certificates:');
  console.error('   cd frontend/ssl');
  console.error('   mkcert localhost 127.0.0.1 ::1');
  process.exit(1);
}
