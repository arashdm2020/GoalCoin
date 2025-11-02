const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sslDir = path.join(__dirname, '../ssl');

// Ensure SSL directory exists
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

const certPath = path.join(sslDir, 'localhost-cert.pem');
const keyPath = path.join(sslDir, 'localhost-key.pem');

// Check if certificates already exist and are recent (less than 30 days old)
const shouldRegenerate = () => {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    return true;
  }
  
  const certStats = fs.statSync(certPath);
  const daysSinceCreation = (Date.now() - certStats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceCreation > 30; // Regenerate if older than 30 days
};

const generateCertificate = () => {
  console.log('Generating SSL certificate...');
  
  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    const opensslCmd = `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=Dev/L=Local/O=GoalCoin/CN=localhost"`;
    execSync(opensslCmd, { stdio: 'inherit' });
    
    console.log('SSL certificate generated successfully!');
    console.log(`Certificate: ${certPath}`);
    console.log(`Private Key: ${keyPath}`);
    
    return true;
  } catch (error) {
    console.error('Failed to generate SSL certificate:', error.message);
    console.log('\nAlternative: Using Node.js built-in certificate generation...');
    
    // Fallback to Node.js method
    return generateWithNode();
  }
};

const generateWithNode = () => {
  try {
    const selfsigned = require('selfsigned');
    
    const attrs = [
      { name: 'commonName', value: 'localhost' },
      { name: 'countryName', value: 'US' },
      { shortName: 'ST', value: 'Dev' },
      { name: 'localityName', value: 'Local' },
      { name: 'organizationName', value: 'GoalCoin' }
    ];
    
    const options = {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'localhost' },
            { type: 2, value: '127.0.0.1' },
            { type: 7, ip: '127.0.0.1' },
            { type: 7, ip: '::1' }
          ]
        }
      ]
    };
    
    const pems = selfsigned.generate(attrs, options);
    
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    
    console.log('SSL certificate generated with Node.js!');
    return true;
  } catch (error) {
    console.error('Node.js certificate generation failed:', error.message);
    return false;
  }
};

const showBrowserInstructions = () => {
  console.log('\nBrowser Setup Instructions:');
  console.log('================================');
  console.log('1. Open https://localhost:3000 in your browser');
  console.log('2. Click "Advanced" or "Show Details"');
  console.log('3. Click "Proceed to localhost (unsafe)"');
  console.log('4. Do the same for https://localhost:3001');
  console.log('\nAfter this one-time setup, HTTPS will work smoothly!');
  console.log('\nCertificate valid for 365 days');
};

// Main execution
if (shouldRegenerate()) {
  console.log('SSL certificate needs to be generated/updated...');
  
  if (generateCertificate()) {
    showBrowserInstructions();
  } else {
    console.error('Failed to generate SSL certificate');
    process.exit(1);
  }
} else {
  console.log('SSL certificate is up to date');
  console.log(`Certificate expires in ${Math.ceil(30 - (Date.now() - fs.statSync(certPath).mtime.getTime()) / (1000 * 60 * 60 * 24))} days`);
}

module.exports = { generateCertificate, shouldRegenerate };
