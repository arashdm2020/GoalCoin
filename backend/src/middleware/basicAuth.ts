import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

/**
 * Basic Authentication middleware using bcrypt
 * Expects ADMIN_PASSWORD_HASH environment variable
 */
export const basicAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  console.log('🔐 BasicAuth Middleware');
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    console.log('❌ No valid Authorization header');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Validate username (optional - can be configured)
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  console.log('Username:', username, '| Expected:', expectedUsername);
  if (username !== expectedUsername) {
    console.log('❌ Username mismatch');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Validate password using bcrypt
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    console.error('ADMIN_PASSWORD_HASH environment variable not set');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log('Password validation result:', isValid);
    if (!isValid) {
      console.log('❌ Invalid password');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('✅ Authentication successful');
    next();
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
