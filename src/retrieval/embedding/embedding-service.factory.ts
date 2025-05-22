import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embedding-service.interface';
import { GoogleGenerativeAiEmbeddingService } from './google-generative-ai-embedding.service';
import { OpenAiEmbeddingService } from './openai-embedding.service';

export type EmbeddingProvider = 'google' | 'openai';

@Injectable()
export class EmbeddingServiceFactory {
  createService(provider?: EmbeddingProvider): EmbeddingService {
    // Si no se especifica un proveedor, utilizar el definido en variables de entorno o Google por defecto
    const selectedProvider = provider || process.env.EMBEDDING_PROVIDER || 'openai';
    
    if (selectedProvider === 'openai') {
      return new OpenAiEmbeddingService();
    }
    
    // Por defecto, usar Google
    return new GoogleGenerativeAiEmbeddingService();
  }
}
