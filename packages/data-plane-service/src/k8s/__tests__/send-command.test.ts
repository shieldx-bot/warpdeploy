import request from 'supertest';

// Mock side-effectful modules before requiring the app
jest.mock('../jobs/vps/ssh', () => ({
  connectSSH: jest.fn().mockResolvedValue({ status: 'success', ip: '203.0.113.1' }),
}));

jest.mock('../Database/Connect', () => jest.fn(async () => ({ connected: false })));

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

// Mock k8s client (ESM) to avoid parsing issues and side effects
jest.mock('@kubernetes/client-node', () => ({
  KubeConfig: class { loadFromDefault() {}; makeApiClient() { return {}; } },
  CoreV1Api: class {},
}), { virtual: true });

// Now require the TS app entry
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app, server } = require('../index.ts');

afterAll((done) => {
  try {
    server.close(() => done());
  } catch (e) {
    done();
  }
});

describe('POST /send-command', () => {
  it('returns SSH result JSON on success', async () => {
    const res = await request(app)
      .post('/send-command')
      .send({ host: 'example.com', username: 'ubuntu', command: 'uptime' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', ip: '203.0.113.1' });
  });

  it('returns 500 when SSH throws', async () => {
    const { connectSSH } = require('../jobs/vps/ssh');
    connectSSH.mockRejectedValueOnce(new Error('SSH failed'));

    const res = await request(app)
      .post('/send-command')
      .send({ host: 'bad-host', username: 'ubuntu', command: 'uptime' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to execute command' });
  });
});
