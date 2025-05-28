import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { APIResponseDto } from './classes';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { StorageHealthIndicator } from './storage/storage.health';
import { RetrievalHealthIndicator } from './retrieval/retrieval.health';
import { MongoDBHealthIndicator } from './providers/mongodb.health';

@Controller('')
@ApiBearerAuth()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly storageHealth: StorageHealthIndicator,
    private readonly retrievalHealth: RetrievalHealthIndicator,
    private readonly mongodbHealth: MongoDBHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  async healthCheck(): Promise<APIResponseDto> {
    const result = await this.health.check([
      () => this.storageHealth.isHealthy('storage'),
      () => this.retrievalHealth.isHealthy('retrieval'),
      () => this.mongodbHealth.isHealthy('mongodb'),
    ]);

    const services: { name: string; status: string }[] = [];
    const errors: string[] = [];

    Object.entries(result.details).forEach(([serviceName, detail]) => {
      const status = detail.status === 'up' ? 'ok' : 'error';
      services.push({ name: serviceName, status });

      if (detail.status !== 'up') {
        errors.push(`${serviceName}: ${detail.error}`);
      }
    });

    if (errors.length > 0) {
      throw new ServiceUnavailableException({
        message: 'Error de servicio',
        error: errors.join('; '),
      });
    }

    return new APIResponseDto({
      status: 'ok',
      message: 'Todos los servicios están disponibles',
      data: { services },
    });
  }

  @Get('ready')
  async ready(): Promise<APIResponseDto> {
    return await this.healthCheck();
  }
}
