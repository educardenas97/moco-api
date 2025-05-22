import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { StorageService } from './storage.service';

@Injectable()
export class StorageHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly storageService: StorageService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.storageService.listFiles('');
      return indicator.up();
    } catch (error) {
      return indicator.down({ error: error.message });
    }
  }
}
