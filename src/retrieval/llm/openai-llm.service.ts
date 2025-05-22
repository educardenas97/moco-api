import { Injectable, Logger } from '@nestjs/common';
import { LLMService, GenerationOptions } from './llm-service.interface';
import { RetrievalResponseDto } from '../dto/retrieval-response.dto';
import OpenAI from 'openai';

/**
 * Implementación del servicio LLM utilizando la API de OpenAI
 */
@Injectable()
export class OpenAILLMService implements LLMService {
  private readonly logger = new Logger(OpenAILLMService.name);
  private openai: OpenAI;
  private readonly defaultModel = 'gpt-4.1';

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
      const context = documents
        .map((doc) => `--- Documento: ${doc.title} ---\n${doc.content}`)
        .join('\n\n');

      // Configurar valores por defecto
      const systemMessage =
        options.systemMessage ??
        'Eres un asesor legal experto que responde con precisión y claridad, citando las fuentes legales correspondientes.';
      const country = options.country ?? 'paraguaya';

      // Generar el prompt para el LLM
      const prompt = `
        Eres un asistente legal especializado en la legislación ${country}. La consulta es:

        "${query}"

        Basado en los siguientes documentos legales, proporciona una respuesta clara, precisa y fundamentada:

        ${context}

        Tu respuesta debe:
        1. Explicar los aspectos legales relevantes a la consulta
        2. Citar las leyes, decretos o tratados específicos que apliquen
        3. Presentar la información de manera estructurada y comprensible
        4. En caso de no encontrar información relevante, indicar que no se encontró respuesta
        5. Si la consulta no es legal o sobre legislación, indicar que no es posible responder
        6. Si la consulta es sobre legislación de otro país, indicar que no es posible responder


        El formato de salida debe ser en Markdown, con encabezados y listas numeradas o con viñetas según corresponda.
        `;

      // Determinar el modelo a utilizar
      const model = process.env.OPENAI_MODEL || this.defaultModel;

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
        'No se pudo generar una respuesta.'
      );
    } catch (error) {
      this.logger.error('Error al generar respuesta con OpenAI', error);
      throw new Error(`Error al generar respuesta: ${error.message}`);
    }
  }
}
