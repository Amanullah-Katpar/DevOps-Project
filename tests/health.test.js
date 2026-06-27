const request = require('supertest');
const app = require('../src/app');

// ─── TEST 1: Health Check ─────────────────────────────────────────────────────
describe('Health Check Endpoint', () => {
  it('TEST 1: GET /api/health should return 200 with service status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('DevFlow API');
    expect(res.body.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });
});
