const request = require('supertest');
const crypto = require('crypto');
const { app } = require('../src/index');

describe('GitHub Webhook Endpoint', () => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test_webhook_secret';
  const payload = {
    ref: 'refs/heads/main',
    commits: [
      {
        id: '90b171f11e9a',
        message: 'fix login timeout #142',
        author: { name: 'Gaurang', email: 'gaurang@devpulse.dev' },
      },
    ],
    repository: { id: 123456, name: 'devpulse-app' },
  };

  const bodyString = JSON.stringify(payload);
  const validSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(bodyString))
      .digest('hex');

  it('should accept valid signature and respond with 200', async () => {
    const res = await request(app)
      .post('/api/webhooks/github')
      .set('X-Hub-Signature-256', validSignature)
      .set('X-GitHub-Delivery', 'delivery-123')
      .set('X-GitHub-Event', 'push')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject invalid signature with 401', async () => {
    const res = await request(app)
      .post('/api/webhooks/github')
      .set('X-Hub-Signature-256', 'sha256=invalid_signature')
      .set('X-GitHub-Delivery', 'delivery-124')
      .set('X-GitHub-Event', 'push')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
