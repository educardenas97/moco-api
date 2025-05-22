import { Provider } from '@nestjs/common';
import * as redis from 'redis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: async () => {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error('Intentos de reconexión fallidos');
            process.exit(1);
          }
          return Math.min(retries * 100, 5000);
        },
        connectTimeout: process.env.REDIS_CONNECT_TIMEOUT
          ? parseInt(process.env.REDIS_CONNECT_TIMEOUT)
          : 10000,
      },
    });

    client.on('error', (error) => console.error('error de conexión:', error));
    await client.connect();
    client.on('connect', () => console.log('Conectado a Redis'));

    return client;
  },
};
