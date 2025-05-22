import { Injectable, Logger } from '@nestjs/common';
import { RetrievalRequestDto } from './dto/retrieval-request.dto';
import { EmbeddingService } from './embedding/embedding-service.interface';
import { DocumentRetrievalService } from './document-retrieval/document-retrieval-service.interface';
import { DocumentContentService } from './document-content/document-content-service.interface';
import {
  EmbeddingServiceFactory,
  EmbeddingProvider,
} from './embedding/embedding-service.factory';
import { DocumentRetrievalServiceFactory } from './document-retrieval/document-retrieval-service.factory';
import { DocumentContentServiceFactory } from './document-content/document-content-service.factory';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private embeddingService: EmbeddingService;
  private documentRetrievalService: DocumentRetrievalService;
  private documentContentService: DocumentContentService;

  constructor(
    private embeddingServiceFactory: EmbeddingServiceFactory,
    private documentRetrievalServiceFactory: DocumentRetrievalServiceFactory,
    private documentContentServiceFactory: DocumentContentServiceFactory,
  ) {
    // Obtener el proveedor de embeddings desde las variables de entorno
    const embeddingProvider = process.env
      .EMBEDDING_PROVIDER as EmbeddingProvider;
    this.embeddingService =
      this.embeddingServiceFactory.createService(embeddingProvider);
    this.documentRetrievalService =
      this.documentRetrievalServiceFactory.createService();
    this.documentContentService =
      this.documentContentServiceFactory.createService();
  }

  /**
   * Metodo para recuperar documentos desde el sistema de archivos
   *
   * @param retrievalRequestDto
   * @returns
   */
  async retrieve(retrievalRequestDto: RetrievalRequestDto) {
    const { query } = retrievalRequestDto;

    this.logger.debug(`Recuperando documentos para la pregunta: ${query}`);

    const embedding = await this.embeddingService.getEmbedding(query);

    this.logger.debug(`Embedding obtenido: ${embedding.length} dimensiones`);

    const dataPoints = await this.documentRetrievalService.findDocuments(
      embedding,
      retrievalRequestDto.retrieval_setting,
    );
    this.logger.debug(`Datapoins encontrados: ${JSON.stringify(dataPoints)}`);

    const records = (
      await Promise.all(
        dataPoints.map(async (doc) =>
          this.documentContentService
            .getDocumentText(doc.filename, doc.pageNumber)
            .then((context) =>
              context.text && context.text.trim()
                ? {
                    metadata: {
                      path: `gs://knowledge-base-docs-fintech-ia-labs/${doc.filename}`,
                      description: 'Documento obtenido desde GCP',
                      context: context.metadata,
                    },
                    context: context.metadata,
                    score: doc.score || 1.0,
                    title: doc.filename,
                    content: context.text,
                  }
                : null,
            ),
        ),
      )
    ).filter((record) => record !== null);

    return records;
  }

  /**
   * Metodo para obtener todos los tópicos almacenados en el sistema de archivos
   * @returns Promise<string[]>
   */
  async getOptions(): Promise<{
    topics: string[];
    questions: string[];
  }> {
    try {
      const [topics, questions] = await Promise.all([
        this.documentContentService.getTopics(),
        this.documentContentService.getFAQs(),
      ]);
      this.logger.debug(`Tópicos obtenidos: ${topics}`);
      this.logger.debug(`Preguntas frecuentes obtenidas: ${questions}`);
      return {
        topics,
        questions,
      };
    } catch (error) {
      this.logger.error('Error al obtener los tópicos', error);
      throw error;
    }
  }
}
