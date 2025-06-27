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
import { LegalQueryRequestDto } from './dto/legal-query-request.dto';
import { LegalQueryResponseDto } from './dto/legal-query-response.dto';
import { RetrievalResponseDto } from './dto/retrieval-response.dto';
import { LLMService } from './llm/llm-service.interface';
import { LLMServiceFactory } from './llm/llm-service.factory';
import { LLMConfig } from './llm/llm.config';
import { LegalPromptTemplates } from './llm/legal-prompt-templates';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private embeddingService: EmbeddingService;
  private documentRetrievalService: DocumentRetrievalService;
  private documentContentService: DocumentContentService;
  private llmService: LLMService;

  constructor(
    private embeddingServiceFactory: EmbeddingServiceFactory,
    private documentRetrievalServiceFactory: DocumentRetrievalServiceFactory,
    private documentContentServiceFactory: DocumentContentServiceFactory,
    private llmServiceFactory: LLMServiceFactory,
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

    // Inicializar el servicio LLM
    this.llmService = this.llmServiceFactory.createService();
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
                      path: `gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${doc.filename}`,
                      description: 'Documento obtenido desde GCP',
                      context: context.metadata,
                    },
                    context: context.metadata,
                    score: doc.score || 1.0,
                    title: doc.filename,
                    content: context.text,
                    pageNumber: doc.pageNumber,
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

  /**
   * Método para procesar consultas legales utilizando documentación basada en leyes, decretos y tratados
   * Recupera documentos relevantes y genera una respuesta usando un LLM
   * @param legalQueryRequestDto Consulta legal a procesar
   * @returns Respuesta generada con documentos fuente
   */
  async queryLegalDocuments(
    legalQueryRequestDto: LegalQueryRequestDto,
  ): Promise<LegalQueryResponseDto> {
    try {
      this.logger.debug(
        `Procesando consulta legal: ${legalQueryRequestDto.query}`,
      );

      // 1. Recuperar documentos relevantes basados en la consulta
      const retrievalRequest = new RetrievalRequestDto();
      retrievalRequest.query = legalQueryRequestDto.query;
      retrievalRequest.knowledge_id = 'legal'; // Identificador para el conocimiento legal
      retrievalRequest.retrieval_setting = {
        top_k: 25, // Recuperar los 25 documentos más relevantes
        score_threshold: 0.95, // Umbral de relevancia
      };

      const documents = await this.retrieve(retrievalRequest);

      if (!documents || documents.length === 0) {
        return {
          answer: LegalPromptTemplates.NO_DOCUMENTS_RESPONSE,
          sources: [],
        };
      }

      // 2. Validar que el modelo sea compatible con el proveedor si se especifica
      if (legalQueryRequestDto.provider && legalQueryRequestDto.model) {
        if (
          !LLMConfig.isValidModel(
            legalQueryRequestDto.provider,
            legalQueryRequestDto.model,
          )
        ) {
          throw new Error(
            `El modelo ${legalQueryRequestDto.model} no es válido para el proveedor ${legalQueryRequestDto.provider}`,
          );
        }
      }

      // 3. Crear el servicio LLM específico basado en el proveedor solicitado
      const llmService = this.llmServiceFactory.createService(
        legalQueryRequestDto.provider,
        legalQueryRequestDto.model,
      );

      // 4. Generar una respuesta usando el LLM con los documentos recuperados
      const country = 'paraguaya'; // Por defecto, legislación paraguaya
      const options = {
        systemMessage: LegalPromptTemplates.generateSystemMessage(country),
        country: country,
        model: legalQueryRequestDto.model, // Modelo específico si se proporciona
      };

      const answer = await llmService.generateResponse(
        legalQueryRequestDto.query,
        documents,
        options,
      );

      return {
        answer,
        sources: documents,
      };
    } catch (error) {
      this.logger.error('Error al procesar la consulta legal', error);
      throw error;
    }
  }

  /**
   * Obtiene los modelos disponibles para cada proveedor LLM
   * @returns Objeto con los modelos disponibles por proveedor
   */
  async getAvailableModels(): Promise<{ [provider: string]: string[] }> {
    try {
      return LLMConfig.getAvailableModels();
    } catch (error) {
      this.logger.error('Error al obtener modelos disponibles', error);
      throw error;
    }
  }
}
