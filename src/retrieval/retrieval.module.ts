import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { EmbeddingServiceFactory } from './embedding/embedding-service.factory';
import { DocumentRetrievalServiceFactory } from './document-retrieval/document-retrieval-service.factory';
import { DocumentContentServiceFactory } from './document-content/document-content-service.factory';
import { GoogleGenerativeAiEmbeddingService } from './embedding/google-generative-ai-embedding.service';
import { OpenAiEmbeddingService } from './embedding/openai-embedding.service';
import { VertexAiMatchingEngineRetrievalService } from './document-retrieval/vertex-ai-matching-engine-retrieval.service';
import { FirestoreDocumentContentService } from './document-content/firestore-document-content.service';
import { RetrievalController } from './retrieval.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { RetrievalHealthIndicator } from './retrieval.health';
import { TerminusModule } from '@nestjs/terminus';
import { RedisProvider } from '../providers/redis.provider';
import { RedisDocumentContentService } from './document-content/redis-document-content.service';
import { RedisVectorRetrievalService } from './document-retrieval/redis-retrieval.service';
import { LLMServiceFactory } from './llm/llm-service.factory';
import { OpenAILLMService } from './llm/openai-llm.service';

@Module({
  imports: [
    CacheModule.register({ ttl: Number(process.env.CACHE_TTL) || 3600 }),
    TerminusModule,
  ],
  controllers: [RetrievalController],
  providers: [
    RetrievalService,
    EmbeddingServiceFactory,
    DocumentRetrievalServiceFactory,
    DocumentContentServiceFactory,
    LLMServiceFactory,
    GoogleGenerativeAiEmbeddingService,
    OpenAiEmbeddingService,
    OpenAILLMService,
    VertexAiMatchingEngineRetrievalService,
    FirestoreDocumentContentService,
    RedisDocumentContentService,
    RedisVectorRetrievalService,
    RetrievalHealthIndicator,
    RedisProvider,
  ],
  exports: [RetrievalService, RetrievalHealthIndicator],
})
export class RetrievalModule {}
