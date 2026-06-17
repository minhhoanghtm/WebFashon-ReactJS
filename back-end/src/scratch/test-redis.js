import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
});

console.log('Initial Status:', redis.status);

redis.on('error', (err) => {
  console.log('Redis error event:', err.message);
});

async function run() {
  if (redis.status !== 'ready') {
    console.log('Redis is not ready! Skipping.');
    redis.disconnect();
    return;
  }
  console.log('Sending GET request...');
  const res = await redis.get('test_key');
  console.log('Response:', res);
  redis.disconnect();
}

setTimeout(run, 1000);
