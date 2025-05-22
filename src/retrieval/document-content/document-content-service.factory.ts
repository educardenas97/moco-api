import { Inject, Injectable } from '@nestjs/common';
import { DocumentContentService } from './document-content-service.interface';
import { FirestoreDocumentContentService } from './firestore-document-content.service';
import { RedisDocumentContentService } from './redis-document-content.service';

@Injectable()
export class DocumentContentServiceFactory {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  createService(): DocumentContentService {
    const storageType = process.env.STORAGE_TYPE || 'redis';

    switch (storageType) {
      case 'firestore':
        return new FirestoreDocumentContentService();
      case 'redis':
        return new RedisDocumentContentService(this.redisClient);
      default:
        throw new Error(`Tipo de storage no soportado: ${storageType}`);
    }
  }
}
