const request = require('supertest');
const app = require('../src/app');

const testUser = {
  username: 'taskowner',
  email: 'tasks@devflow.com',
  password: 'password123'
};

let authToken;

// Register and log in before task tests
beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send(testUser);
  authToken = res.body.token;
});

// ─── TEST 6: Create Task ──────────────────────────────────────────────────────
describe('Tasks - Create', () => {
  it('TEST 6: POST /api/tasks should create a task when authenticated', async () => {
    const taskData = {
      title: 'Setup CI/CD Pipeline',
      description: 'Configure GitHub Actions for the DevFlow project',
      priority: 'high',
      status: 'todo'
    };

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe(taskData.title);
    expect(res.body.task.priority).toBe('high');
    expect(res.body.task.status).toBe('todo');
    expect(res.body.task._id).toBeDefined();
  });
});

// ─── TEST 7: Get Tasks ────────────────────────────────────────────────────────
describe('Tasks - List', () => {
  it('TEST 7: GET /api/tasks should return paginated task list for authenticated user', async () => {
    // Create two tasks first
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'First Task', priority: 'low' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Second Task', priority: 'medium' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBe(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
  });
});

// ─── TEST 8: Delete Task ──────────────────────────────────────────────────────
describe('Tasks - Delete', () => {
  it('TEST 8: DELETE /api/tasks/:id should delete a task and return 200', async () => {
    // Create a task
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Task to Delete', priority: 'low' });

    const taskId = createRes.body.task._id;

    // Delete it
    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/deleted/i);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(404);
  });
});

// ─── BONUS: Unauthenticated access ───────────────────────────────────────────
describe('Tasks - Auth Protection', () => {
  it('GET /api/tasks without token should return 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
