const bcrypt = require('bcrypt');

async function generatePassword() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('\n=== Admin Credentials ===');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nAdd this to your .env file:');
    console.log('ADMIN_PASSWORD_HASH=' + hash);
    console.log('ADMIN_USERNAME=admin');
    console.log('\n========================\n');
  } catch (error) {
    console.error('Error generating password:', error);
  }
}

generatePassword();
