const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const sslDir = path.join(__dirname, '..', 'ssl');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Generate certificate attributes
const attrs = [{ name: 'commonName', value: 'localhost' }];

// Generate certificate options
const options = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyCertSign: false,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: 'localhost',
        },
        {
          type: 2, // DNS
          value: '*.localhost',
        },
        {
          type: 7, // IP
          ip: '127.0.0.1',
        },
        {
          type: 7, // IP
          ip: '::1',
        },
      ],
    },
  ],
};

// Generate the certificate
const pems = selfsigned.generate(attrs, options);

// Write certificate and key to files
const certPath = path.join(sslDir, 'localhost-cert.pem');
const keyPath = path.join(sslDir, 'localhost-key.pem');

fs.writeFileSync(certPath, pems.cert);
fs.writeFileSync(keyPath, pems.private);

console.log('✅ SSL certificate generated successfully!');
console.log(`📄 Certificate: ${certPath}`);
console.log(`🔑 Private Key: ${keyPath}`);
console.log('\n⚠️  This is a self-signed certificate for development only.');
console.log('   Your browser will show a security warning that you can safely ignore.');

