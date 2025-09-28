const request = require('supertest');
const app = require('../app');

describe('DevOps Lifecycle Demo API', () => {
  
  // Close any open handles after all tests
  afterAll(async () => {
    // Close any open handles
    await new Promise(resolve => setImmediate(resolve));
  });
  
  
  test('GET / should return app info', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.message).toBe('SAP BTP DevOps Lifecycle Demo');
    expect(response.body.status).toBe('healthy');
    expect(response.body.requestId).toBeDefined();
  });

  test('GET /health should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.message).toBe('OK');
    expect(response.body.uptime).toBeGreaterThan(0);
    expect(response.body.requestId).toBeDefined();
  });

  test('GET /info should return detailed info', async () => {
    const response = await request(app)
      .get('/info')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.name).toBe('DevOps Lifecycle Demo');
    expect(response.body.version).toBeDefined();
    expect(response.body.node_version).toBeDefined();
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(response.body.error).toBe('Not Found');
  });
  
});