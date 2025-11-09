/**
 * Generate bcrypt hash for admin password
 * Usage: node scripts/generate-admin-hash.js YOUR_PASSWORD
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('❌ Please provide a password');
  console.log('Usage: node scripts/generate-admin-hash.js YOUR_PASSWORD');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error generating hash:', err);
    process.exit(1);
  }

  console.log('\n✅ Admin Password Hash Generated!\n');
  console.log('Add this to your Render.com environment variables:\n');
  console.log('ADMIN_PASSWORD_HASH=' + hash);
  console.log('\nADMIN_USERNAME=admin');
  console.log('\n📝 Steps:');
  console.log('1. Go to Render.com Dashboard');
  console.log('2. Select your Backend Service');
  console.log('3. Go to Environment tab');
  console.log('4. Add the variables above');
  console.log('5. Save and redeploy\n');
});
