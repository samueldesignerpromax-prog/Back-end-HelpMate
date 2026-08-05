const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => console.log('🟢 Conectado ao Redis'));
redis.on('error', (err) => console.log('🔴 Erro no Redis:', err.message));

module.exports = redis;
