/**
 * Admin Authentication Middleware
 * Basic Auth for admin endpoints
 */

import { Request, Response, NextFunction } from 'express';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Unauthorized - Basic Auth required' });
    return;
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized - Invalid credentials' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized - Invalid auth header' });
  }
};
