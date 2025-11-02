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

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Validate username (optional - can be configured)
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  if (username !== expectedUsername) {
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
    if (!isValid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
