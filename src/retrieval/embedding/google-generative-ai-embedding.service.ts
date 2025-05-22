import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding-service.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GoogleGenerativeAiEmbeddingService implements EmbeddingService {
  private readonly logger = new Logger(GoogleGenerativeAiEmbeddingService.name);

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(
        'Error al obtener el embedding del texto con GoogleGenerativeAI',
        error,
      );
      throw error;
    }
  }
}
