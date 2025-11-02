const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL certificate paths
const sslDir = path.join(__dirname, 'ssl');

// Prefer mkcert certificates (no browser warning) if they exist
// mkcert generates files like: localhost+2.pem and localhost+2-key.pem
let certPath = path.join(sslDir, 'localhost+2.pem');
let keyPath = path.join(sslDir, 'localhost+2-key.pem');

// Fall back to self-signed certificates if mkcert certificates don't exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  certPath = path.join(sslDir, 'localhost-cert.pem');
  keyPath = path.join(sslDir, 'localhost-key.pem');
  
  // Generate self-signed certificates if they don't exist or are old
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('🔐 SSL certificates not found. Setting up SSL...');
    require('./scripts/setup-ssl.js');
    certPath = path.join(sslDir, 'localhost-cert.pem');
    keyPath = path.join(sslDir, 'localhost-key.pem');
  } else {
    // Check if certificates need renewal (older than 30 days)
    const certStats = fs.statSync(certPath);
    const daysSinceCreation = (Date.now() - certStats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 30) {
      console.log('🔄 SSL certificates are old. Regenerating...');
      require('./scripts/setup-ssl.js');
    }
  }
}

// Read SSL certificates
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`\nServer ready on https://${hostname}:${port}\n`);
    
    // Check if using mkcert (trusted) or self-signed certificate
    const usingMkcert = certPath.includes('localhost+2.pem');
    if (usingMkcert) {
      console.log('Using locally trusted certificate (no browser warning).');
    } else {
      console.log('Warning: Using self-signed certificate for HTTPS.');
      console.log('   Your browser will show a security warning that you can safely ignore.');
      console.log('   To remove the warning, install mkcert and generate a trusted certificate.\n');
    }
  });
});

