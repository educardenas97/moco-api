import { Injectable, Logger } from '@nestjs/common';
import { LLMService, GenerationOptions } from './llm-service.interface';
import { RetrievalResponseDto } from '../dto/retrieval-response.dto';
import { LegalPromptTemplates } from './legal-prompt-templates';
import OpenAI from 'openai';

/**
 * Implementación del servicio LLM utilizando la API de OpenAI
 */
@Injectable()
export class OpenAILLMService implements LLMService {
  private readonly logger = new Logger(OpenAILLMService.name);
  private openai: OpenAI;
  private readonly defaultModel = 'o4-mini'; // Modelo por defecto, puede ser configurado en variables de entorno

  constructor() {
    this.logger.log('Inicializando OpenAILLMService');
    try {
      if (!process.env.OPENAI_API_KEY) {
        this.logger.warn(
          'OPENAI_API_KEY no está configurada. El servicio podría no funcionar correctamente',
        );
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.logger.log(`Cliente OpenAI inicializado correctamente.`);
    } catch (error) {
      this.logger.error('Error al inicializar el cliente OpenAI', error);
      throw error;
    }
  }

  /**
   * Genera una respuesta utilizando el modelo de OpenAI
   */
  async generateResponse(
    query: string,
    documents: RetrievalResponseDto[],
    options: GenerationOptions = {},
  ): Promise<string> {
    try {
      if (!this.openai) {
        throw new Error(
          'Cliente OpenAI no inicializado. Verifique la configuración de API_KEY',
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

      this.logger.debug(`Generando respuesta con modelo ${model}`);

      // Llamada al LLM
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return (
        response.choices[0].message.content ||
        LegalPromptTemplates.ERROR_RESPONSE
      );
    } catch (error) {
      this.logger.error('Error al generar respuesta con OpenAI', error);
      throw new Error(`Error al generar respuesta: ${error.message}`);
    }
  }
}
