import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding-service.interface';
import OpenAI from 'openai';

@Injectable()
export class OpenAiEmbeddingService implements EmbeddingService {
  private readonly logger = new Logger(OpenAiEmbeddingService.name);
  private openai: OpenAI;
  private readonly model = 'text-embedding-3-small';

  constructor() {
    this.logger.log('Inicializando OpenAiEmbeddingService');
    try {
      // Verificar si la API key está configurada
      if (!process.env.OPENAI_API_KEY) {
        this.logger.warn(
          'OPENAI_API_KEY no está configurada. El servicio podría no funcionar correctamente',
        );
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.logger.log(
        `Cliente OpenAI inicializado correctamente. Modelo a utilizar: ${this.model}`,
      );
    } catch (error) {
      this.logger.error('Error al inicializar el cliente OpenAI', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    this.logger.debug(
      `Solicitando embedding para texto de longitud: ${text.length}`,
    );

    try {
      if (!text || text.trim().length === 0) {
        this.logger.warn('Se intentó generar embedding para texto vacío');
        return [];
      }

      this.logger.debug(
        `Llamando a la API de OpenAI con modelo: ${this.model}`,
      );
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });

      const embedding = response.data[0].embedding;
      const dimensions = embedding.length;

      this.logger.log(
        `Embedding generado exitosamente. Dimensiones: ${dimensions}`,
      );

      return embedding;
    } catch (error) {
      this.logger.error(`Error al obtener el embedding del texto con OpenAI`, {
        error: error.message,
        status: error.status,
        code: error.code,
      });

      if (error.response) {
        this.logger.error(
          `Respuesta de error de OpenAI: ${JSON.stringify(error.response.data)}`,
        );
      }

      throw error;
    }
  }
}
