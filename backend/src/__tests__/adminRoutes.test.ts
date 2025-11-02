import request from 'supertest';
import express from 'express';
import { adminRoutes } from '../routes/adminRoutes';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('GET /api/admin/users', () => {
  it('should return 401 without credentials', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .auth('admin', 'wrong-password')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});
