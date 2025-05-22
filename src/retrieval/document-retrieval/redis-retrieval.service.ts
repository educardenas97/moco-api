import { Injectable, Logger, Inject } from '@nestjs/common';
import { DocumentRetrievalService } from './document-retrieval-service.interface';
import { RetrievalSetting } from '../dto/retrieval-request.dto';
import * as Float32Array from '@stdlib/array-float32';

@Injectable()
export class RedisVectorRetrievalService implements DocumentRetrievalService {
  private readonly logger = new Logger(RedisVectorRetrievalService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: any,
  ) {}

  async findDocuments(
    embedding: number[],
    retrievalSetting: RetrievalSetting,
  ): Promise<{ filename: string; pageNumber: number; score?: number }[]> {
    const indexName = process.env.REDIS_VECTOR_INDEX || 'document_index';
    const numNeighbors = retrievalSetting.top_k || 25;
    const scoreThreshold = retrievalSetting.score_threshold || 0.7; // Valor por defecto más restrictivo

    try {
      this.logger.debug(
        `Consultando a Redis Vector Search en el índice: ${indexName}, umbral: ${scoreThreshold}`,
      );

      // Preparar el embedding para la búsqueda (convertir a Float32Array)
      const vector = new Float32Array(embedding);

      // Crear consulta KNN para Redis con filtro de score
      // En Redis, menor score significa mayor similitud (usando distancia coseno)
      const query = `*=>[KNN ${numNeighbors} @embedding $embedding AS score]`;

      // Ejecutar la búsqueda
      const results = await this.redisClient.ft.search(indexName, query, {
        PARAMS: {
          embedding: Buffer.from(vector.buffer),
        },
        RETURN: ['filename', 'score','page'],
        SORTBY: 'score',
        DIALECT: 2,
      });

      this.logger.debug(
        `Respuesta de Redis Vector Search: ${JSON.stringify(results)}`,
      );

      if (!results || !results.documents || results.documents.length === 0) {
        this.logger.debug('No se encontraron documentos similares');
        return [];
      }

      // Filtrar resultados por el score threshold
      // En Redis Vector Search, menor score significa mejor similitud
      const filteredResults = results.documents.filter(
        (doc) => parseFloat(doc.value.score) <= scoreThreshold,
      );

      this.logger.debug(
        `Documentos encontrados: ${results.documents.length}, filtrados por umbral: ${filteredResults.length}`,
      );

      // Transformar los resultados al formato esperado
      return filteredResults.map((doc) => {
        // Extraer información del documento
        const documentId = doc.id;

        // Obtener el filename y score desde la estructura value
        const filename = doc.value.filename;
        const score = parseFloat(doc.value.score);

        // Extraer pageNumber del ID si está disponible, o usar 0 como default
        const pageNumber = doc.value.page || 0;

        return {
          filename,
          pageNumber,
          documentId, // Opcional: añadir el ID completo por si es útil en otras partes
          score,
        };
      });
    } catch (error) {
      this.logger.error(
        'Error al consultar Redis Vector Search',
        error.message,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }
}
