import request from 'supertest';
import express from 'express';
import { userRoutes } from '../routes/userRoutes';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('POST /api/users/connect', () => {
  it('should return 200 for valid Ethereum address', async () => {
    const response = await request(app)
      .post('/api/users/connect')
      .send({ address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('address');
    expect(response.body.user).toHaveProperty('connectedAt');
  });

  it('should return 400 for missing address', async () => {
    const response = await request(app)
      .post('/api/users/connect')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid address format', async () => {
    const response = await request(app)
      .post('/api/users/connect')
      .send({ address: 'invalid-address' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
