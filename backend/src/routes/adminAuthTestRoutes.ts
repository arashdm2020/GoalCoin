import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * Test admin authentication
 * POST /api/admin-test/verify
 * Body: { username, password }
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    console.log('🔐 Admin Auth Test');
    console.log('Username provided:', username);
    console.log('Expected username:', expectedUsername);
    console.log('Password hash exists:', !!passwordHash);

    if (!passwordHash) {
      res.status(500).json({ 
        error: 'ADMIN_PASSWORD_HASH not configured',
        hint: 'Run: node scripts/generate-admin-hash.js YOUR_PASSWORD'
      });
      return;
    }

    if (username !== expectedUsername) {
      res.status(401).json({ 
        error: 'Invalid username',
        provided: username,
        expected: expectedUsername
      });
      return;
    }

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      res.status(401).json({ 
        error: 'Invalid password',
        hint: 'Password does not match the hash'
      });
      return;
    }

    // Generate Basic Auth header for frontend
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = `Basic ${credentials}`;

    res.json({
      success: true,
      message: 'Authentication successful',
      authHeader,
      instructions: 'Use this header in Authorization for admin requests'
    });

  } catch (error: any) {
    console.error('Admin auth test error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check current environment configuration
 */
router.get('/config', (req: Request, res: Response): void => {
  const hasUsername = !!process.env.ADMIN_USERNAME;
  const hasPasswordHash = !!process.env.ADMIN_PASSWORD_HASH;

  res.json({
    configured: hasUsername && hasPasswordHash,
    ADMIN_USERNAME: hasUsername ? 'Set ✅' : 'Not set ❌',
    ADMIN_PASSWORD_HASH: hasPasswordHash ? 'Set ✅' : 'Not set ❌',
    hint: !hasPasswordHash ? 'Run: node scripts/generate-admin-hash.js YOUR_PASSWORD' : null
  });
});

export { router as adminAuthTestRoutes };
