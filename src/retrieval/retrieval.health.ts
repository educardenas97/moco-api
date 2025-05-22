import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { RetrievalService } from './retrieval.service';

@Injectable()
export class RetrievalHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.retrievalService.getOptions();
      return indicator.up();
    } catch (error) {
      return indicator.down({ error: error.message });
    }
  }
}
