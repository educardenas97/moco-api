import { Provider, Logger } from '@nestjs/common';
import * as redis from 'redis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: async () => {
    const logger = new Logger('RedisProvider');
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Intentos de reconexión fallidos');
            process.exit(1);
          }
          return Math.min(retries * 100, 5000);
        },
        connectTimeout: process.env.REDIS_CONNECT_TIMEOUT
          ? parseInt(process.env.REDIS_CONNECT_TIMEOUT)
          : 10000,
      },
    });

    client.on('error', (error) => logger.error('error de conexión:', error));
    await client.connect();
    client.on('connect', () => logger.log('Conectado a Redis'));
    client.on('disconnect', () => logger.log('Desconectado de Redis'));

    return client;
  },
};
