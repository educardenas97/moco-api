import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import mongoose from 'mongoose';

@Injectable()
export class MongoDBHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('MONGODB_CONNECTION')
    private readonly mongoConnection: typeof mongoose,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Verifica si la conexión a MongoDB está activa
      const isConnected = this.mongoConnection.connection.readyState === 1;

      if (isConnected) {
        // Verifica si la base de datos está disponible
        if (!this.mongoConnection.connection.db) {
          throw new Error('MongoDB database instance is not available');
        }
        await this.mongoConnection.connection.db.admin().ping();
        return this.getStatus(key, true, {
          status: 'connected',
          database: this.mongoConnection.connection.name || 'unknown',
        });
      } else {
        throw new Error('MongoDB connection not ready');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown MongoDB error';
      throw new HealthCheckError(
        'MongoDB check failed',
        this.getStatus(key, false, { error: errorMessage }),
      );
    }
  }
}
