import { Provider, Logger } from '@nestjs/common';
import mongoose from 'mongoose';

export const MongoDBProvider: Provider = {
  provide: 'MONGODB_CONNECTION',
  useFactory: async () => {
    const logger = new Logger('MongoDBProvider');
    const mongoUrl =
      process.env.MONGODB_URL || 'mongodb://localhost:27017/moco-api';

    mongoose.set('strictQuery', false);

    const connection = await mongoose.connect(mongoUrl, {
      retryWrites: true,
    });

    // Event listeners for connection monitoring
    mongoose.connection.on('connected', () => {
      logger.log(
        'Conectado a MongoDB: ' +
          connection.connection.host +
          ':' +
          connection.connection.port,
      );
    });

    mongoose.connection.on('error', (error) => {
      logger.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.log('Desconectado de MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.log(
        '🛑 Conexión a MongoDB cerrada debido a la terminación de la aplicación',
      );
      process.exit(0);
    });

    return connection;
  },
};
