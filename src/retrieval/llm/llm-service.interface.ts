import { RetrievalResponseDto } from '../dto/retrieval-response.dto';

/**
 * Interfaz para servicios de LLM
 * Define el contrato para los diferentes proveedores de LLM
 */
export interface LLMService {
  /**
   * Genera una respuesta basada en una consulta y documentos de contexto
   * 
   * @param query Consulta del usuario
   * @param documents Documentos recuperados como contexto
   * @param options Opciones adicionales para la generación (temperatura, max_tokens, etc.)
   * @returns El texto generado por el LLM
   */
  generateResponse(
    query: string,
    documents: RetrievalResponseDto[],
    options?: GenerationOptions,
  ): Promise<string>;
}

/**
 * Opciones de generación para controlar la salida del LLM
 */
export interface GenerationOptions {
  /**
   * Temperatura de generación (0.0 - 1.0)
   * Valores más bajos generan respuestas más determinísticas
   * Valores más altos generan respuestas más creativas
   */
  temperature?: number;
  
  /**
   * Número máximo de tokens a generar
   */
  maxTokens?: number;
  
  /**
   * Mensaje del sistema para establecer el comportamiento del LLM
   */
  systemMessage?: string;
  
  /**
   * País o legislación sobre la que se está consultando
   */
  country?: string;
  
  /**
   * Otras opciones específicas del modelo
   */
  [key: string]: any;
}

/**
 * Tipos de modelos LLM soportados
 */
export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}
