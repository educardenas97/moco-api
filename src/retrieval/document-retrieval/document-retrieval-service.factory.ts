import { Inject, Injectable } from '@nestjs/common';
import { DocumentRetrievalService } from './document-retrieval-service.interface';
import { VertexAiMatchingEngineRetrievalService } from './vertex-ai-matching-engine-retrieval.service';
import { RedisVectorRetrievalService } from './redis-retrieval.service';

@Injectable()
export class DocumentRetrievalServiceFactory {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  createService(): DocumentRetrievalService {
    const retrievalServiceType = process.env.RETRIEVAL_SERVICE_TYPE || 'redis';

    switch (retrievalServiceType) {
      case 'vertex-ai':
        return new VertexAiMatchingEngineRetrievalService();
      case 'redis':
        return new RedisVectorRetrievalService(this.redisClient);
      default:
        throw new Error(`Unsupported retrieval service type: ${retrievalServiceType}`);
    }
  }
}
