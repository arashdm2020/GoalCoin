/**
 * Test if a password matches the hash
 * Usage: node scripts/test-password.js PASSWORD
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];
const hash = process.env.ADMIN_PASSWORD_HASH || '$2b$10$sWNWLmTzw4jKRg2tIu16ieh4MXOibIEbZfJOOxaY1xru8ysY6n8jq';

if (!password) {
  console.error('❌ Please provide a password to test');
  console.log('Usage: node scripts/test-password.js PASSWORD');
  process.exit(1);
}

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  if (result) {
    console.log('✅ Password matches!');
    console.log('Password:', password);
    console.log('\nYou can use this in the admin login form.');
  } else {
    console.log('❌ Password does NOT match');
    console.log('Tried:', password);
    console.log('Try another password or generate a new hash.');
  }
});
