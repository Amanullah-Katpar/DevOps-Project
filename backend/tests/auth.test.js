const request = require('supertest');
const app = require('../src/app');

const testUser = {
  username: 'testuser',
  email: 'test@devflow.com',
  password: 'password123'
};

// ─── TEST 2: Successful Registration ─────────────────────────────────────────
describe('Auth - Register', () => {
  it('TEST 2: POST /api/auth/register should create a new user and return JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.username).toBe(testUser.username);
    // Password must never be exposed
    expect(res.body.user.password).toBeUndefined();
  });

  // ─── TEST 3: Duplicate Email Rejection ─────────────────────────────────────
  it('TEST 3: POST /api/auth/register should reject duplicate email with 400', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Try registering again with the same email
    const res = await request(app).post('/api/auth/register').send({
      username: 'otheruser',
      email: testUser.email,
      password: 'different123'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already in use/i);
  });
});

// ─── TEST 4: Successful Login ─────────────────────────────────────────────────
describe('Auth - Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(testUser);
  });

  it('TEST 4: POST /api/auth/login should return JWT token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  // ─── TEST 5: Invalid Credentials ───────────────────────────────────────────
  it('TEST 5: POST /api/auth/login should return 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });
});
