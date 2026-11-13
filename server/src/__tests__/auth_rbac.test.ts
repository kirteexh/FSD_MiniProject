import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import { dbStore } from '../services/dbStore';

const TEST_SECRET = 'test_super_secure_jwt_secret_key_2026_test';

describe('Auth & RBAC Middleware Tests', () => {
  let adminToken: string;
  let cashierToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;

    // Create mock admin and cashier
    const adminId = '660000000000000000000099';
    const cashierId = '660000000000000000000098';

    dbStore.users.push({
      _id: adminId,
      name: 'Admin Test',
      email: 'admin.test@pharmacare.io',
      role: 'admin',
      isActive: true,
      passwordHash: 'dummy',
    });

    dbStore.users.push({
      _id: cashierId,
      name: 'Cashier Test',
      email: 'cashier.test@pharmacare.io',
      role: 'cashier',
      isActive: true,
      passwordHash: 'dummy',
    });

    adminToken = jwt.sign({ id: adminId, role: 'admin' }, TEST_SECRET);
    cashierToken = jwt.sign({ id: cashierId, role: 'cashier' }, TEST_SECRET);
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid tokens with 401', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
  });

  it('allows cashiers to view inventory', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${cashierToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blocks cashiers from administrative routes with 403 Forbidden', async () => {
    // Attempt to access staff management as cashier
    const staffRes = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${cashierToken}`);
    expect(staffRes.status).toBe(403);
    expect(staffRes.body.message).toMatch(/Forbidden/);

    // Attempt to access reports as cashier
    const reportsRes = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${cashierToken}`);
    expect(reportsRes.status).toBe(403);

    // Attempt to adjust stock as cashier
    const adjustRes = await request(app)
      .post('/api/inventory/some-med-id/adjust')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ batchId: 'b1', quantityChange: 5, reason: 'test' });
    expect(adjustRes.status).toBe(403);
  });

  it('permits administrators to access administrative routes', async () => {
    const staffRes = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(staffRes.status).toBe(200);
    expect(staffRes.body.success).toBe(true);
  });
});

