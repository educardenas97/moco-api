import { Injectable, Logger } from '@nestjs/common';
import { LLMService, GenerationOptions } from './llm-service.interface';
import { RetrievalResponseDto } from '../dto/retrieval-response.dto';
import { LegalPromptTemplates } from './legal-prompt-templates';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Implementación del servicio LLM utilizando la API de Anthropic Claude
 */
@Injectable()
export class ClaudeLLMService implements LLMService {
  private readonly logger = new Logger(ClaudeLLMService.name);
  private anthropic: Anthropic;
  private readonly defaultModel = 'claude-3-7-sonnet-latest';

  constructor() {
    this.logger.log('Inicializando ClaudeLLMService');
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        this.logger.warn(
          'ANTHROPIC_API_KEY no está configurada. El servicio podría no funcionar correctamente',
        );
      }

      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.logger.log(`Cliente Anthropic inicializado correctamente.`);
    } catch (error) {
      this.logger.error('Error al inicializar el cliente Anthropic', error);
      throw error;
    }
  }

  /**
   * Genera una respuesta utilizando el modelo de Claude
   */
  async generateResponse(
    query: string,
    documents: RetrievalResponseDto[],
    options: GenerationOptions = {},
  ): Promise<string> {
    try {
      if (!this.anthropic) {
        throw new Error(
          'Cliente Anthropic no inicializado. Verifique la configuración de API_KEY',
        );
      }

      // Extraer contexto de los documentos recuperados
      const context = LegalPromptTemplates.formatDocumentsContext(documents);

      // Configurar valores por defecto
      const country = options.country ?? 'paraguaya';
      const systemMessage =
        options.systemMessage ??
        LegalPromptTemplates.generateSystemMessage(country);

      // Generar el prompt para el LLM usando la plantilla centralizada
      const prompt = LegalPromptTemplates.generateLegalQueryPrompt(
        query,
        context,
        country,
      );

      // Determinar el modelo a utilizar (puede venir en options o usar variable de entorno)
      const model = options.model || this.defaultModel;

      this.logger.debug(`Generando respuesta con modelo Claude ${model}`);

      // Llamada al LLM de Claude
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extraer el contenido de la respuesta
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return LegalPromptTemplates.ERROR_RESPONSE;
    } catch (error) {
      this.logger.error('Error al generar respuesta con Claude', error);
      throw new Error(`Error al generar respuesta: ${error.message}`);
    }
  }
}
